#!/usr/bin/env python3
"""
Chat History Logger - Claude Code Hook
=======================================
Logs user prompts and assistant responses to daily Markdown files
in chat_history/YYYY_MM_DD.md

This script handles two hook events:
  - UserPromptSubmit: logs the user's prompt directly from the hook input
  - Stop: logs the assistant's response by parsing the transcript JSONL

Toggle: create/delete .claude/chat-history-enabled to enable/disable logging.

Cloud Sync: create/delete .claude/chat-history-cloud-enabled and configure
.claude/chat-history-cloud-config.json to enable/disable cloud sync.
Supports MongoDB and Supabase.
"""

import sys
import json
import os
from datetime import datetime, timezone
from pathlib import Path

# Content truncation settings
MAX_CONTENT_SIZE = 14 * 1024 * 1024  # 14MB (leave 2MB buffer for metadata)
TRUNCATION_SUFFIX = "...."

def truncate_content(content: str) -> tuple[str, bool]:
    """Truncate content if it exceeds the size limit. Returns (content, was_truncated)."""
    if len(content.encode('utf-8')) >= MAX_CONTENT_SIZE:
        truncated = content.encode('utf-8')[:MAX_CONTENT_SIZE - len(TRUNCATION_SUFFIX)].decode('utf-8', errors='ignore')
        return truncated + TRUNCATION_SUFFIX, True
    return content, False


def load_cloud_config(cwd):
    """Load cloud sync configuration from JSON file."""
    config_path = os.path.join(cwd, '.claude', 'chat-history-cloud-config.json')
    if not os.path.exists(config_path):
        return None
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def sync_to_mongodb(config, doc):
    """Sync a chat document to MongoDB."""
    try:
        from pymongo import MongoClient

        # Support both nested config (config.mongodb.*) and flat config (config.*)
        mongo_cfg = config.get('mongodb', config)
        connection_string = mongo_cfg.get('connection_string', mongo_cfg.get('connectionString', ''))
        database_name = mongo_cfg.get('database_name', mongo_cfg.get('database', 'chat_history'))
        collection_name = mongo_cfg.get('collection_name', mongo_cfg.get('collection', 'conversations'))

        client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
        db = client[database_name]
        collection = db[collection_name]

        # Ensure indexes exist (idempotent)
        collection.create_index('date')
        collection.create_index('project_name')
        collection.create_index([('timestamp', -1)])
        collection.create_index('session_id')

        doc['_created_at'] = datetime.now(timezone.utc)
        collection.insert_one(doc)
        client.close()
        return True
    except ImportError:
        print("[ChatHistoryLogger] pymongo not installed. Run: pip install pymongo", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[ChatHistoryLogger] MongoDB sync failed: {e}", file=sys.stderr)
        return False


def sync_to_supabase(config, doc):
    """Sync a chat document to Supabase."""
    try:
        from supabase import create_client

        # Support both nested config (config.supabase.*) and flat config (config.*)
        supa_cfg = config.get('supabase', config)
        supabase_url = supa_cfg.get('supabase_url', supa_cfg.get('url', ''))
        supabase_key = supa_cfg.get('supabase_key', supa_cfg.get('key', ''))
        table_name = supa_cfg.get('supabase_table', supa_cfg.get('table', 'chat_history'))

        client = create_client(supabase_url, supabase_key)

        row = {
            'session_id': doc['session_id'],
            'timestamp': doc['timestamp'],
            'date': doc['date'],
            'role': doc['role'],
            'content': doc['content'],
            'source': doc['source'],
            'project_path': doc['project_path'],
            'project_name': doc['project_name'],
            'local_file': doc['metadata']['local_file'],
            'message_id': doc['metadata']['message_id'],
            'truncated': doc['metadata'].get('truncated', False),
        }

        result = client.table(table_name).insert(row).execute()
        return True
    except ImportError:
        print("[ChatHistoryLogger] supabase not installed. Run: pip install supabase", file=sys.stderr)
        return False
    except Exception as e:
        print(f"[ChatHistoryLogger] Supabase sync failed: {e}", file=sys.stderr)
        return False


def sync_to_cloud(cwd, role, content, transcript_path=''):
    """Sync a message to cloud if cloud sync is enabled."""
    cloud_enabled_file = os.path.join(cwd, '.claude', 'chat-history-cloud-enabled')
    if not os.path.exists(cloud_enabled_file):
        return

    config = load_cloud_config(cwd)
    if not config:
        return

    truncated_content, was_truncated = truncate_content(content)

    now = datetime.now(timezone.utc)
    date_str = now.strftime('%Y_%m_%d')
    project_name = os.path.basename(os.path.abspath(cwd))

    # Use transcript path as session ID for grouping, or generate one
    session_id = transcript_path if transcript_path else f"claude_{int(now.timestamp())}"

    doc = {
        'session_id': session_id,
        'timestamp': now.isoformat(),
        'date': date_str,
        'role': role,
        'content': truncated_content,
        'source': 'claude-code',
        'project_path': os.path.abspath(cwd),
        'project_name': project_name,
        'metadata': {
            'local_file': f'chat_history/{date_str}.md',
            'message_id': f'{role}_{int(now.timestamp())}',
            'truncated': was_truncated,
        }
    }

    provider = config.get('provider', '')
    if provider == 'mongodb':
        sync_to_mongodb(config, doc)
    elif provider == 'supabase':
        sync_to_supabase(config, doc)
    else:
        print(f"[ChatHistoryLogger] Unknown cloud provider: {provider}", file=sys.stderr)


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    hook_event = input_data.get('hook_event_name', '')
    cwd = input_data.get('cwd', os.getcwd())
    transcript_path = input_data.get('transcript_path', '')

    # Check if logging is enabled via toggle file
    enabled_file = os.path.join(cwd, '.claude', 'chat-history-enabled')
    if not os.path.exists(enabled_file):
        sys.exit(0)

    # Set up chat_history directory
    chat_history_dir = os.path.join(cwd, 'chat_history')
    os.makedirs(chat_history_dir, exist_ok=True)

    # Date formatting
    today = datetime.now()
    date_file = today.strftime('%Y_%m_%d')
    date_header = today.strftime('%A, %B %d, %Y')
    timestamp = today.strftime('%H:%M')

    file_path = os.path.join(chat_history_dir, f'{date_file}.md')

    # Create header if file doesn't exist
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            f.write(f'# Chat History - {date_header}\n\n---\n\n')

    # Handle UserPromptSubmit: log the user's message
    if hook_event == 'UserPromptSubmit':
        prompt = input_data.get('prompt', '')
        if prompt:
            with open(file_path, 'a') as f:
                f.write(f'### User [{timestamp}]\n\n{prompt}\n\n---\n\n')

            # Cloud sync (non-blocking best effort)
            try:
                sync_to_cloud(cwd, 'user', prompt, transcript_path)
            except Exception:
                pass

    # Handle Stop: log the assistant's response
    elif hook_event == 'Stop':
        assistant_text = ''

        # Try to parse the transcript JSONL to extract the latest assistant response
        if transcript_path and os.path.exists(transcript_path):
            import time
            # Small delay to ensure the transcript file is fully written
            time.sleep(0.1)
            
            try:
                # Read the transcript file from the end to find the most recent assistant message
                with open(transcript_path, 'r') as f:
                    lines = f.readlines()

                # Search backwards through the JSONL for the last assistant message with text content
                for line in reversed(lines):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        msg = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Skip non-assistant entries
                    if msg.get('type') != 'assistant':
                        continue

                    # Check for role="assistant" in a nested message field (most common format)
                    message_obj = msg.get('message', {})
                    if message_obj.get('role') == 'assistant':
                        content = message_obj.get('content', [])
                        if isinstance(content, list):
                            text_parts = [
                                block.get('text', '')
                                for block in content
                                if block.get('type') == 'text' and block.get('text')
                            ]
                            if text_parts:
                                assistant_text = '\n'.join(text_parts)
                                break

                    # Check for role="assistant" at the top level (fallback)
                    if msg.get('role') == 'assistant':
                        content = msg.get('content', [])
                        if isinstance(content, list):
                            text_parts = [
                                block.get('text', '')
                                for block in content
                                if block.get('type') == 'text' and block.get('text')
                            ]
                            if text_parts:
                                assistant_text = '\n'.join(text_parts)
                                break

            except Exception:
                pass

        # Log the assistant response
        if assistant_text:
            with open(file_path, 'a') as f:
                f.write(f'### Assistant [{timestamp}]\n\n{assistant_text}\n\n---\n\n')

            # Cloud sync (non-blocking best effort)
            try:
                sync_to_cloud(cwd, 'assistant', assistant_text, transcript_path)
            except Exception:
                pass
        else:
            # Fallback: log a placeholder if we couldn't extract the text
            with open(file_path, 'a') as f:
                f.write(f'### Assistant [{timestamp}]\n\n*[Response logged]*\n\n---\n\n')

    sys.exit(0)


if __name__ == '__main__':
    main()
