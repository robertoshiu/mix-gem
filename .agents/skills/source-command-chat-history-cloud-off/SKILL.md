---
name: "source-command-chat-history-cloud-off"
description: "Disable cloud sync for chat history"
---

# source-command-chat-history-cloud-off

Use this skill when the user asks to run the migrated source command `chat-history-cloud-off`.

## Command Template

Disable cloud synchronization for chat history logging. Local logging will continue to work.

Steps:
1. Delete the file `.Codex/chat-history-cloud-enabled` if it exists.
2. Keep the `.Codex/chat-history-cloud-config.json` file intact so the user can re-enable cloud sync later without reconfiguring.

After deleting the file, respond with: "Cloud sync is now OFF. Local chat history logging remains active. Your cloud configuration has been preserved for future use."
