---
name: tellem-journal
description: Use Tellem as the source-of-truth journal and MCP memory for coding sessions, decisions, and daily notes.
---

# Tellem Journal

Use the `tellem` MCP server as the source of truth for journal memory. Repo Markdown files, scratch specs, and cache files are downstream working material unless the user explicitly says otherwise.

At session start:

1. Call `list_notes` with a small limit to inspect recent journal notes.
2. Find today's note by `entryDate`. If none exists and you need to write memory, call `create_journal_note` with today's date.
3. Read the active memory target with `get_journal_note` before appending.

When the user asks you to remember, summarize, or preserve session context:

- Use `append_journal_note` for session summaries, decisions, open questions, and follow-up context.
- Use `update_journal_note` only when editing a known note intentionally.
- Use `list_folders` to find Tellem Collections when organization matters.
- Use `create_folder`, `update_folder`, `delete_folder`, and `move_note_to_folder` when the user asks to organize journal notes into collections.
- Pass `folderId` to `create_journal_note`, `update_journal_note`, `list_notes`, or `search_notes` when a note belongs in a known collection.
- Keep entries concise and dated. Prefer Markdown bullets for decisions and follow-ups.
- Do not create or commit local source-of-truth Markdown files as a substitute for Tellem.

When the user asks you to preserve supporting material:

- Use `create_source_link` for public URLs that should be searchable later.
- Use `create_source_text` for copied text, notes from another tool, or short research snippets.
- Use `upload_source_file` only for small base64 file/image payloads already provided to you; do not read local file paths through MCP.
- Pass `noteId` when a source belongs with a specific journal note, or call `attach_source_to_note` after creating/finding the source.
- Reference saved sources in Markdown with stable app-owned links: `[Source title](/sources/{sourceId})`.
- Reference saved images with the private preview route: `![Source title](/api/knowledge/sources/{sourceId}/preview)`.
- Never store raw storage URLs or local machine file paths in Tellem notes.

For questions about prior work or personal context:

- Use `list_notes` for counts, recency, and choosing notes.
- Use `list_folders` to understand collection structure before filing or scoped retrieval.
- Use `search_notes` or `ask_notes` for recall.
- Use `get_journal_note` for the exact authored note body.
- Use `list_sources`, `search_knowledge`, and `get_source` for saved links, files, images, and source text.
