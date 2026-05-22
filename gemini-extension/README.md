# Tellem Gemini CLI Extension

This extension configures Gemini CLI to use Tellem's remote OAuth MCP connector.

Install this folder as a Gemini CLI extension, or add the server directly:

```bash
gemini mcp add --transport http tellem https://journalmcp.com/mcp
```

Gemini CLI supports Streamable HTTP MCP servers through `httpUrl` and can use OAuth discovery when the server returns a 401 challenge with metadata.
