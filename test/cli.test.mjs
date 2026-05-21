import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../dist/bin.js", import.meta.url));

function runCli({ env = {}, input = "" } = {}) {
  const childEnv = { ...process.env, ...env };
  if (env.TELLEM_TOKEN === undefined) {
    delete childEnv.TELLEM_TOKEN;
  }

  const child = spawn(process.execPath, [cliPath], {
    env: childEnv,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  if (input) child.stdin.write(input);
  child.stdin.end();

  return once(child, "close").then(([code]) => ({ code, stdout, stderr }));
}

async function withServer(handler, run) {
  const server = createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("missing TELLEM_TOKEN exits with stderr only", async () => {
  const result = await runCli({ env: { TELLEM_TOKEN: undefined } });

  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /TELLEM_TOKEN/);
});

test("initializes, stores negotiated protocol version, and lists tools", async () => {
  const requests = [];

  await withServer(
    (req, res) => {
      let body = "";
      req.setEncoding("utf8");
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const parsed = JSON.parse(body);
        requests.push({ headers: req.headers, body: parsed });

        res.setHeader("content-type", "application/json");
        if (parsed.method === "initialize") {
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: parsed.id,
            result: { protocolVersion: "2025-11-25" },
          }));
          return;
        }

        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: parsed.id,
          result: { tools: [] },
        }));
      });
    },
    async (appUrl) => {
      const result = await runCli({
        env: {
          TELLEM_TOKEN: "tellem_mcp_test",
          TELLEM_APP_URL: appUrl,
        },
        input: [
          JSON.stringify({ jsonrpc: "2.0", id: "init", method: "initialize" }),
          JSON.stringify({ jsonrpc: "2.0", id: "tools", method: "tools/list" }),
          "",
        ].join("\n"),
      });

      const lines = result.stdout.trim().split("\n").map((line) => JSON.parse(line));

      assert.equal(result.code, 0);
      assert.equal(lines.length, 2);
      assert.equal(lines[0].result.protocolVersion, "2025-11-25");
      assert.deepEqual(lines[1].result.tools, []);
      assert.equal(requests[0].headers.authorization, "Bearer tellem_mcp_test");
      assert.match(requests[0].headers.accept, /application\/json/);
      assert.match(requests[0].headers.accept, /text\/event-stream/);
      assert.equal(requests[1].headers["mcp-protocol-version"], "2025-11-25");
    },
  );
});

test("forwards HTTP auth failures as JSON-RPC errors", async () => {
  await withServer(
    (_req, res) => {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Valid MCP Bearer token required." }));
    },
    async (appUrl) => {
      const result = await runCli({
        env: {
          TELLEM_TOKEN: "tellem_mcp_bad",
          TELLEM_APP_URL: appUrl,
        },
        input: `${JSON.stringify({ jsonrpc: "2.0", id: "tools", method: "tools/list" })}\n`,
      });
      const payload = JSON.parse(result.stdout.trim());

      assert.equal(result.code, 0);
      assert.equal(payload.id, "tools");
      assert.equal(payload.error.code, -32000);
      assert.match(payload.error.message, /Bearer token/);
      assert.equal(result.stderr, "");
    },
  );
});

test("parses minimal text/event-stream responses", async () => {
  await withServer(
    (_req, res) => {
      res.setHeader("content-type", "text/event-stream");
      res.end([
        "event: message",
        'data: {"jsonrpc":"2.0","id":"tools","result":{"tools":[]}}',
        "",
        "",
      ].join("\n"));
    },
    async (appUrl) => {
      const result = await runCli({
        env: {
          TELLEM_TOKEN: "tellem_mcp_test",
          TELLEM_APP_URL: appUrl,
        },
        input: `${JSON.stringify({ jsonrpc: "2.0", id: "tools", method: "tools/list" })}\n`,
      });
      const payload = JSON.parse(result.stdout.trim());

      assert.equal(result.code, 0);
      assert.deepEqual(payload.result.tools, []);
    },
  );
});
