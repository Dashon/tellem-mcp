# Tellem MCP

Stdio bridge for connecting MCP clients such as Claude Desktop, Claude Code, Cursor, and other local agents to Tellem.

The bridge runs locally as a subprocess, reads newline-delimited MCP JSON-RPC from stdin, forwards each message to Tellem's Streamable HTTP endpoint, and writes only MCP JSON-RPC responses to stdout. Logs and diagnostics go to stderr.

## Quick Start: Claude Code

Create a scoped MCP token from your Tellem Account page. For journal memory writes,
include `notes:read`, `notes:create`, and `notes:write`.

Then install the Claude Code skill and MCP server:

```bash
TELLEM_TOKEN=tellem_mcp_... TELLEM_APP_URL=https://tellem-ten.vercel.app npx -y tellem-mcp@latest install claude-code
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
      "command": "npx",
      "args": ["-y", "tellem-mcp@0.1.3"],
      "env": {
        "TELLEM_TOKEN": "tellem_mcp_...",
        "TELLEM_APP_URL": "https://tellem-ten.vercel.app"
      }
    }
  }
}
```

`TELLEM_APP_URL` is optional and defaults to `https://tellem-ten.vercel.app`.

## Configuration

| Environment variable | Required | Description |
| --- | --- | --- |
| `TELLEM_TOKEN` | Yes | Scoped MCP token created in Tellem Account settings. |
| `TELLEM_APP_URL` | No | Tellem app origin. Defaults to `https://tellem-ten.vercel.app`. |

## Journal Memory Tools

Use Tellem as the authored workspace and source of truth. The bridge exposes
the server tools, including:

- `list_notes`, `search_notes`, and `ask_notes` for recall.
- `get_journal_note` for exact Markdown journal reads.
- `create_journal_note`, `append_journal_note`, and `update_journal_note` for
  agent memory writes when the token has write scopes.

Local repo files can still be generated working copies, but Tellem should hold
the durable journal state.

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

## License

MIT
