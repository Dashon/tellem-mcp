# Tellem MCP

Stdio bridge for connecting MCP clients such as Claude Desktop, Claude Code, Cursor, and other local agents to Tellem. Tellem also exposes a remote OAuth MCP connector for cloud clients at `https://journalmcp.com/mcp`.

The bridge runs locally as a subprocess, reads newline-delimited MCP JSON-RPC from stdin, forwards each message to Tellem's Streamable HTTP endpoint, and writes only MCP JSON-RPC responses to stdout. Logs and diagnostics go to stderr.

## Quick Start: Claude Code

Create a scoped MCP token from your Tellem Account page. For the normal
shared notebook flow, include `notes:read`, `knowledge:read`,
`knowledge:write`, `notes:create`, and `notes:write`.

Then install the Claude Code skill and MCP server:

```bash
TELLEM_TOKEN=tellem_mcp_... TELLEM_APP_URL=https://tellem-ten.vercel.app npm exec --yes --package=tellem-mcp@0.1.7 -- tellem-mcp install claude-code
```

The installer writes `~/.claude/skills/tellem-journal/SKILL.md`. When the
`claude` CLI is available, it also runs `claude mcp add` with a user-scoped
stdio server. If the CLI is unavailable, it prints the exact MCP JSON config.

## Quick Start: Codex

Install the Codex skill and print a ready-to-paste MCP config:

```bash
TELLEM_TOKEN=tellem_mcp_... TELLEM_APP_URL=https://tellem-ten.vercel.app npm exec --yes --package=tellem-mcp@0.1.7 -- tellem-mcp install codex
```

The installer writes `${CODEX_HOME:-~/.codex}/skills/tellem-journal/SKILL.md`
and prints the TOML config to add to `${CODEX_HOME:-~/.codex}/config.toml`.
It does not edit your Codex config file.

Manual config:

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.tellem]
command = "npm"
args = ["exec", "--yes", "--package=tellem-mcp@0.1.7", "--", "tellem-mcp"]
enabled = true

[mcp_servers.tellem.env]
TELLEM_TOKEN = "tellem_mcp_..."
TELLEM_APP_URL = "https://tellem-ten.vercel.app"
```

Restart Codex after changing the config so it reloads MCP servers.

## JSON MCP Clients

For Cursor, Claude Desktop, or manual Claude Code setup, add this to your MCP
client config:

```json
{
  "mcpServers": {
    "tellem": {
      "command": "npm",
      "args": ["exec", "--yes", "--package=tellem-mcp@0.1.7", "--", "tellem-mcp"],
      "env": {
        "TELLEM_TOKEN": "tellem_mcp_...",
        "TELLEM_APP_URL": "https://tellem-ten.vercel.app"
      }
    }
  }
}
```

`TELLEM_APP_URL` is optional and defaults to `https://tellem-ten.vercel.app`.

## Install Best Practices

- Use `npm exec --package=... -- tellem-mcp`, not `npx tellem-mcp`. Some `npx`
  environments install the package but fail to expose its binary on `PATH`.
- Use Node 18 or newer.
- Pin `tellem-mcp@0.1.7` when you want reproducible setup. Use
  `tellem-mcp@latest` when you want local clients to pick up bridge fixes after
  package updates.
- Keep `TELLEM_TOKEN` in local MCP config or environment variables. Do not
  commit it to repos, shell history snippets, or shared docs.
- Start with read-only scopes for search/recall. Add write scopes only for
  agents that should create, append, or update journal memory.
- Rotate tokens that are pasted into terminals, screenshots, chats, or logs.
- Prefer the remote OAuth connector at `https://journalmcp.com/mcp` for cloud
  clients that support HTTPS MCP and OAuth.

## Remote OAuth Connector

Use the remote connector when a cloud client supports HTTPS MCP and OAuth:

```text
https://journalmcp.com/mcp
```

The remote endpoint supports Streamable HTTP as the primary transport and exposes
OAuth discovery metadata so clients can dynamically register, open the browser
authorization flow, and store refresh tokens. Personal `TELLEM_TOKEN` values are
still the right fit for stdio clients and local developer tools.

Platform notes:

- Claude.ai: add a custom connector with `https://journalmcp.com/mcp`.
- ChatGPT: use Developer Mode custom MCP connectors in supported workspaces.
- Gemini CLI: use `gemini mcp add --transport http tellem https://journalmcp.com/mcp` or install the extension in `gemini-extension/`.

## Configuration

| Environment variable | Required | Description |
| --- | --- | --- |
| `TELLEM_TOKEN` | Yes | Scoped MCP token created in Tellem Account settings. |
| `TELLEM_APP_URL` | No | Tellem app origin. Defaults to `https://tellem-ten.vercel.app`. |

## Journal, Source, And Memory Tools

Use Tellem as the authored workspace and source of truth. Dated Markdown
journal notes are canonical. Saved sources are citable evidence. Memory graph
facts and entities are derived context that help agents retrieve the right
notebook material without replacing the journal.

The bridge exposes the server tools, including:

- `get_agent_context` for compact context packets with recent activity,
  relevant facts, cited sources, open questions, and conflicts.
- `list_notes`, `search_notes`, and `ask_notes` for journal recall.
- `search` and `fetch` for connector-friendly read retrieval.
- `get_journal_note` for exact authored Markdown.
- `create_journal_note`, `append_journal_note`, and `update_journal_note` for
  agent memory writes when the token has write scopes.
- `list_folders`, `create_folder`, `update_folder`, and `move_note_to_folder`
  for organizing notes into Tellem Collections.
- `list_sources`, `search_knowledge`, and `get_source` for saved links, files,
  images, and text sources.
- `create_source_link`, `create_source_text`, `upload_source_file`, and
  `attach_source_to_note` for preserving supporting material when the token has
  `knowledge:write`.
- `list_memory_entities`, `get_memory_entity`, `search_memory_facts`,
  `get_memory_timeline`, and `list_memory_conflicts` for graph-aware recall.
- `archive_memory_fact`, `reject_memory_fact`, `merge_memory_entities`, and
  `link_memory_evidence` for limited graph control when the token has write
  scopes and the user intent is clear.

Agents should search before writing when prior context matters, prefer concise
dated journal entries over detached facts, cite notes or sources when using
remembered facts, and surface conflicts instead of silently resolving them. Do
not create or rely on graph facts without evidence. Do not expose or invent
arbitrary delete operations for graph memory.

When referencing saved sources inside a journal note, use stable app-owned
Markdown links such as `[Source title](/sources/{sourceId})`. For images, use
the private preview route `![Source title](/api/knowledge/sources/{sourceId}/preview)`.
Do not put raw storage URLs or local file paths in journal bodies.

`upload_source_file` accepts small base64 JSON payloads only. It does not read
local file paths from the machine running the MCP client.

Collections are backed by one folder per note. Pass `folderId` to
`list_notes`, `search_notes`, `create_journal_note`, or `update_journal_note`
when the note should be scoped or filed under a collection. Pass `folderId:
null` to make a note unfiled.

Local repo files can still be generated working copies, but Tellem should hold
the durable journal and source state.

## Development

```bash
npm install
npm test
```

To test a local checkout from an MCP client, use:

```json
{
  "mcpServers": {
    "tellem": {
      "command": "node",
      "args": ["/absolute/path/to/tellem-mcp/dist/bin.js"],
      "env": {
        "TELLEM_TOKEN": "tellem_mcp_...",
        "TELLEM_APP_URL": "http://localhost:3000"
      }
    }
  }
}
```

## Security

- The token is sent only in the `Authorization: Bearer` header.
- The token is never added to URLs.
- The bridge emits only JSON-RPC messages on stdout.
- The bridge accepts credentials through environment variables, as expected for stdio MCP servers.
- Remote OAuth connector access can be revoked from Tellem without rotating local stdio tokens.

## License

MIT
