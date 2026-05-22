---
name: tellem-journal
description: Use Tellem as the date-first journal, saved-source library, memory graph, and MCP harness for coding sessions, decisions, and durable context.
---

# Tellem Journal

Use the `tellem` MCP server as the source of truth for journal memory. Dated Markdown journal notes are canonical. Saved sources are citable evidence. Memory graph entities and facts are derived, evidence-backed context that help agents retrieve the right notebook material without replacing the authored journal.

Local clients usually connect through the stdio bridge. Cloud clients can use Tellem's remote OAuth MCP connector at `https://journalmcp.com/mcp`.

At session start:

1. Prefer `get_agent_context` when available to gather compact recent activity, relevant facts, cited sources, conflicts, and open questions.
2. Call `list_notes` with a small limit when you need recent journal context or today's note.
3. Find today's note by `entryDate`. If none exists and you need to write memory, call `create_journal_note` with today's date.
4. Read the active memory target with `get_journal_note` before appending.

For questions about prior work or personal context:

- Use `get_agent_context` for a concise context packet before broad recall.
- Use `search` and `fetch` when the host client prefers generic connector-style retrieval.
- Use `search_notes` or `ask_notes` for semantic recall across authored notes.
- Use `get_journal_note` for exact authored Markdown.
- Use `list_sources`, `search_knowledge`, and `get_source` for saved links, files, images, and source text.
- Use `list_memory_entities`, `get_memory_entity`, `search_memory_facts`, and `get_memory_timeline` for graph-aware recall.
- Use `list_memory_conflicts` when facts disagree or when the user asks about changed decisions, preferences, commitments, or project state.
- Cite the note or source trail when answering from remembered facts.
- Surface conflicts instead of silently choosing one side.
- Never create or rely on graph facts without evidence.

When the user asks you to remember, summarize, or preserve session context:

- Prefer `append_journal_note` for decisions, preferences, commitments, project facts, recurring entities, session summaries, open questions, and follow-up context.
- Use `update_journal_note` only when editing a known note intentionally.
- Keep entries concise and dated. Prefer Markdown bullets for decisions and follow-ups.
- Do not store transient filler, guesses, credentials, secrets, or sensitive data unless the user explicitly asks.
- Do not create detached facts as a substitute for a dated journal entry.
- Do not create or commit local source-of-truth Markdown files as a substitute for Tellem.

When the user asks you to preserve supporting material:

- Use `create_source_link` for public URLs that should be searchable later.
- Use `create_source_text` for copied text, notes from another tool, or short research snippets.
- Use `upload_source_file` only for small base64 file/image payloads already provided to you; do not read local file paths through MCP.
- Pass `noteId` when a source belongs with a specific journal note, or call `attach_source_to_note` after creating/finding the source.
- Reference saved sources in Markdown with stable app-owned links: `[Source title](/sources/{sourceId})`.
- Reference saved images with the private preview route: `![Source title](/api/knowledge/sources/{sourceId}/preview)`.
- Never store raw storage URLs or local machine file paths in Tellem notes.

For organization and graph control:

- Use `list_folders` to understand Tellem Collections before filing or scoped retrieval.
- Use `create_folder`, `update_folder`, and `move_note_to_folder` when the user asks to organize notes into collections.
- Pass `folderId` to `create_journal_note`, `update_journal_note`, `list_notes`, or `search_notes` when a note belongs in a known collection.
- Use `archive_memory_fact`, `reject_memory_fact`, `merge_memory_entities`, and `link_memory_evidence` only when the token has write scopes and the user intent is clear.
- Do not expose or invent arbitrary delete operations for graph memory.

Local repo files can still be working copies, generated artifacts, or drafts. Tellem should hold the durable journal and source state.
