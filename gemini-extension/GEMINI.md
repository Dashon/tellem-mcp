# Tellem Journal

Use Tellem as the durable date-first journal, saved-source library, memory graph, and agent context workspace. Dated Markdown journal notes are canonical. Memory graph facts are derived from notes and sources, and should be treated as evidence-backed recall rather than replacement records.

Useful patterns:

- Prefer `get_agent_context` for compact recent activity, relevant facts, cited sources, open questions, and conflicts.
- Use `search` or `search_notes` for broad recall.
- Use `fetch`, `get_journal_note`, or `get_source` for exact records.
- Use `ask_notes` when the user asks a semantic question across their journal.
- Use `list_memory_entities`, `get_memory_entity`, `search_memory_facts`, and `get_memory_timeline` for graph-aware recall.
- Use `list_memory_conflicts` when facts disagree or when decisions, preferences, commitments, or project state may have changed.
- Use collection tools when the user asks to organize notes.
- Use source tools for links, pasted text, and small file/image payloads already available to you.

Write behavior:

- Prefer `append_journal_note` when the user asks to remember, preserve, summarize, or revise durable memory.
- Store decisions, preferences, commitments, project facts, recurring entities, and durable context.
- Do not store transient filler, guesses, credentials, secrets, or sensitive data unless explicitly requested.
- Cite notes or saved sources when using remembered facts.
- Surface conflicts instead of silently resolving them.
- Never create or rely on graph facts without evidence.
- Attach source links with stable app-owned Markdown such as `[Source title](/sources/{sourceId})`.
- Reference saved images with `![Source title](/api/knowledge/sources/{sourceId}/preview)`.
- Do not read local file paths through MCP. If a user wants to save a file, ask them to provide the file contents through the host client or upload it in Tellem.
