# Tellem Gemini CLI Extension

This extension configures Gemini CLI to use Tellem's remote OAuth MCP connector
for date-first journal notes, saved sources, memory graph recall, conflicts,
and compact agent context packets.

Install this folder as a Gemini CLI extension, or add the server directly:

```bash
gemini mcp add --transport http tellem https://journalmcp.com/mcp
```

Gemini CLI supports Streamable HTTP MCP servers through `httpUrl` and can use
OAuth discovery when the server returns a 401 challenge with metadata. The
bundled `GEMINI.md` tells agents to treat dated Markdown journal notes as
canonical, cite saved evidence, surface conflicts, and avoid reading local file
paths through MCP.
