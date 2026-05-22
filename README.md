# Tellem MCP

Stdio bridge for connecting MCP clients such as Claude Desktop, Claude Code, Cursor, and other local agents to Tellem. Tellem also exposes a remote OAuth MCP connector for cloud clients at `https://journalmcp.com/mcp`.

The bridge runs locally as a subprocess, reads newline-delimited MCP JSON-RPC from stdin, forwards each message to Tellem's Streamable HTTP endpoint, and writes only MCP JSON-RPC responses to stdout. Logs and diagnostics go to stderr.

## Quick Start: Claude Code

Create a scoped MCP token from your Tellem Account page. For the normal
shared notebook flow, include `notes:read`, `knowledge:read`,
`knowledge:write`, `notes:create`, and `notes:write`.

Then install the Claude Code skill and MCP server:

```bash
TELLEM_TOKEN=tellem_mcp_... TELLEM_APP_URL=https://tellem-ten.vercel.app npm exec --yes --package=tellem-mcp@latest -- tellem-mcp install claude-code
```

The installer writes `~/.claude/skills/tellem-journal/SKILL.md`. When the
`claude` CLI is available, it also runs `claude mcp add` with a user-scoped
stdio server. If the CLI is unavailable, it prints the exact MCP JSON config.

## Manual MCP Config

For Cursor, Claude Desktop, or manual Claude Code setup, add this to your MCP
client config:

```json
{
  "mcpServers": {
    "tellem": {
      "command": "npm",
      "args": ["exec", "--yes", "--package=tellem-mcp@0.1.6", "--", "tellem-mcp"],
      "env": {
        "TELLEM_TOKEN": "tellem_mcp_...",
        "TELLEM_APP_URL": "https://tellem-ten.vercel.app"
      }
    }
  }
}
```

`TELLEM_APP_URL` is optional and defaults to `https://tellem-ten.vercel.app`.

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

## Journal And Source Tools

Use Tellem as the authored workspace and source of truth. The bridge exposes
the server tools, including:

- `list_notes`, `search_notes`, and `ask_notes` for recall.
- `search` and `fetch` for connector-friendly read retrieval.
- `get_journal_note` for exact Markdown journal reads.
- `create_journal_note`, `append_journal_note`, and `update_journal_note` for
  agent memory writes when the token has write scopes.
- `list_folders`, `create_folder`, `update_folder`, `delete_folder`, and
  `move_note_to_folder` for organizing notes into Tellem Collections.
- `list_sources`, `search_knowledge`, and `get_source` for saved links, files,
  images, and text sources.
- `create_source_link`, `create_source_text`, `upload_source_file`, and
  `attach_source_to_note` for preserving supporting material when the token has
  `knowledge:write`.

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
