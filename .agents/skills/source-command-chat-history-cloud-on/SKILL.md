---
name: "source-command-chat-history-cloud-on"
description: "Enable cloud sync for chat history (MongoDB or Supabase)"
---

# source-command-chat-history-cloud-on

Use this skill when the user asks to run the migrated source command `chat-history-cloud-on`.

## Command Template

Enable cloud synchronization for chat history logging. This syncs your local chat history to a cloud database.

Follow these steps:

1. First check if `.Codex/chat-history-enabled` exists. If not, create it first since local logging must be on for cloud sync to work. The content should be "enabled" and that's it.

2. Create the file `.Codex/chat-history-cloud-enabled` with the content "enabled".

3. Check if `.Codex/chat-history-cloud-config.json` exists.

4. If the config file does NOT exist, ask the user which cloud provider they want to use:
   - **MongoDB** - For MongoDB Atlas or self-hosted MongoDB
   - **Supabase** - For Supabase PostgreSQL database

5. Based on their choice, ask for the required connection details:

   **For MongoDB:**
   - Ask for: Connection string, Database name, Collection name
   - Show current values as defaults (mask the connection string password)

   Then create `.Codex/chat-history-cloud-config.json` with this format (use these exact keys):
   ```json
   {
     "provider": "mongodb",
     "connectionString": "mongodb+srv://username:password@cluster.mongodb.net",
     "database": "your_db_name",
     "collection": "your_collection_name"
   }
   ```

   **For Supabase:**
   - Ask for: Project URL, API Key, Table name
   - Show current values as defaults (mask the API key)

   Then create `.Codex/chat-history-cloud-config.json` with this format (use these exact keys):
   ```json
   {
     "provider": "supabase",
     "supabase_url": "https://your-project.supabase.co",
     "supabase_key": "your-anon-or-service-key",
     "supabase_table": "chat_history"
   }
   ```

   **Important for Supabase users:** Tell them they need to create the table in Supabase first with this SQL:
   ```sql
   CREATE TABLE chat_history (
     id BIGSERIAL PRIMARY KEY,
     session_id TEXT NOT NULL,
     timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     date TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
     content TEXT NOT NULL,
     source TEXT NOT NULL DEFAULT 'Codex',
     project_path TEXT,
     project_name TEXT,
     local_file TEXT,
     message_id TEXT,
     truncated BOOLEAN DEFAULT FALSE
   );
   ```

6. If `.Codex/chat-history-cloud-config.json` already exists, just confirm cloud sync is now enabled.

7. Remind the user to add `.Codex/chat-history-cloud-config.json` to their `.gitignore` to avoid committing credentials.

After completing, respond with: "Cloud sync is now ON. Chat history will be synced to [provider name]. Make sure to add `.Codex/chat-history-cloud-config.json` to your `.gitignore`."
