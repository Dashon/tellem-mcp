# Tellem MCP

Stdio bridge for connecting MCP clients such as Claude Desktop, Claude Code, Cursor, and other local agents to Tellem.

The bridge runs locally as a subprocess, reads newline-delimited MCP JSON-RPC from stdin, forwards each message to Tellem's Streamable HTTP endpoint, and writes only MCP JSON-RPC responses to stdout. Logs and diagnostics go to stderr.

## Quick Start

Create a scoped MCP token from your Tellem Account page, then add this to your MCP client config:

```json
{
  "mcpServers": {
    "tellem": {
      "command": "npx",
      "args": ["-y", "tellem-mcp@latest"],
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
      "args": ["/absolute/path/to/tellem-mcp/dist/cli.js"],
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
