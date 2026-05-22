# Tellem Journal

Use Tellem as the durable journal and source workspace. Prefer searching or fetching Tellem notes and saved sources before relying on local scratch files for memory.

Useful patterns:

- Use `search` or `search_notes` for broad recall.
- Use `fetch`, `get_journal_note`, or `get_source` for exact records.
- Use `ask_notes` when the user asks a semantic question across their journal.
- Use collection tools when the user asks to organize notes.
- Use source tools for links, pasted text, and small file/image payloads already available to you.

Write behavior:

- Create or append journal notes only when the user asks to remember, preserve, summarize, or revise durable memory.
- Attach source links with stable app-owned Markdown such as `[Source title](/sources/{sourceId})`.
- Reference saved images with `![Source title](/api/knowledge/sources/{sourceId}/preview)`.
- Do not read local file paths through MCP. If a user wants to save a file, ask them to provide the file contents through the host client or upload it in Tellem.
