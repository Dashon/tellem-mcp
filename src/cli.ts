#!/usr/bin/env node

import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import type { Readable, Writable } from "node:stream";

type JsonRpcPayload = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  result?: unknown;
  error?: unknown;
};

type FetchLike = typeof fetch;

type BridgeOptions = {
  token: string;
  appUrl?: string;
  input?: Readable;
  output?: Writable;
  errorOutput?: Writable;
  fetchImpl?: FetchLike;
};

const defaultAppUrl = "https://tellem.app";

export function endpointForAppUrl(appUrl = defaultAppUrl) {
  return `${appUrl.replace(/\/+$/, "")}/api/mcp`;
}

export class TellemMcpBridge {
  private negotiatedVersion: string | null = null;
  private readonly endpoint: string;
  private readonly token: string;
  private readonly output: Writable;
  private readonly errorOutput: Writable;
  private readonly fetchImpl: FetchLike;

  constructor({
    token,
    appUrl = defaultAppUrl,
    output = process.stdout,
    errorOutput = process.stderr,
    fetchImpl = fetch,
  }: BridgeOptions) {
    this.token = token;
    this.endpoint = endpointForAppUrl(appUrl);
    this.output = output;
    this.errorOutput = errorOutput;
    this.fetchImpl = fetchImpl;
  }

  async handleLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let requestPayload: JsonRpcPayload;
    try {
      requestPayload = JSON.parse(trimmed) as JsonRpcPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON.";
      this.writeError(null, -32700, `Parse error: ${message}`);
      return;
    }

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: this.requestHeaders(),
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        this.writeError(
          requestPayload.id,
          -32000,
          await this.httpErrorMessage(response),
        );
        return;
      }

      const responsePayload = await readMcpResponse(response);
      if (!responsePayload) return;

      this.rememberNegotiatedVersion(requestPayload, responsePayload);
      this.writePayload(responsePayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown bridge error.";
      this.writeError(
        requestPayload?.id,
        -32603,
        `Bridge network/internal error: ${message}`,
      );
    }
  }

  private requestHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${this.token}`,
    };

    if (this.negotiatedVersion) {
      headers["MCP-Protocol-Version"] = this.negotiatedVersion;
    }

    return headers;
  }

  private rememberNegotiatedVersion(requestPayload: JsonRpcPayload, responsePayload: JsonRpcPayload) {
    const result = responsePayload.result;
    const protocolVersion =
      result && typeof result === "object" && "protocolVersion" in result
        ? (result as { protocolVersion?: unknown }).protocolVersion
        : null;

    if (requestPayload.method === "initialize" && typeof protocolVersion === "string") {
      this.negotiatedVersion = protocolVersion;
    }
  }

  private async httpErrorMessage(response: Response) {
    const text = await response.text().catch(() => "");
    if (!text) return `HTTP Error ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      if (typeof parsed.error === "string") return parsed.error;
      if (
        parsed.error &&
        typeof parsed.error === "object" &&
        "message" in parsed.error &&
        typeof (parsed.error as { message?: unknown }).message === "string"
      ) {
        return (parsed.error as { message: string }).message;
      }
    } catch {
      return text.slice(0, 150);
    }

    return `HTTP Error ${response.status}`;
  }

  private writePayload(payload: JsonRpcPayload) {
    this.output.write(`${JSON.stringify(payload)}\n`);
  }

  private writeError(id: unknown, code: number, message: string) {
    this.writePayload({
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    });
  }

  log(message: string) {
    this.errorOutput.write(`${message}\n`);
  }
}

export async function readMcpResponse(response: Response): Promise<JsonRpcPayload | null> {
  if (response.status === 202 || response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (!text.trim()) return null;

  if (contentType.includes("text/event-stream")) {
    const payload = parseSseJsonRpc(text);
    if (payload) return payload;
    throw new Error("SSE response did not include a JSON-RPC message.");
  }

  return JSON.parse(text) as JsonRpcPayload;
}

export function parseSseJsonRpc(text: string): JsonRpcPayload | null {
  let dataLines: string[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("data:")) {
      const data = line.slice(5).trimStart();
      if (data) dataLines.push(data);
      continue;
    }

    if (line === "" && dataLines.length > 0) {
      const payload = parseJsonRpcPayload(dataLines.join("\n"));
      if (payload) return payload;
      dataLines = [];
    }
  }

  return dataLines.length > 0 ? parseJsonRpcPayload(dataLines.join("\n")) : null;
}

function parseJsonRpcPayload(value: string): JsonRpcPayload | null {
  try {
    const payload = JSON.parse(value) as JsonRpcPayload;
    return payload?.jsonrpc === "2.0" ? payload : null;
  } catch {
    return null;
  }
}

export function runBridge({
  token,
  appUrl,
  input = process.stdin,
  output = process.stdout,
  errorOutput = process.stderr,
  fetchImpl = fetch,
}: BridgeOptions) {
  const bridge = new TellemMcpBridge({
    token,
    appUrl,
    output,
    errorOutput,
    fetchImpl,
  });

  const rl = createInterface({
    input,
    output,
    terminal: false,
  });

  let pending = Promise.resolve();
  rl.on("line", (line) => {
    pending = pending.then(() => bridge.handleLine(line));
  });

  return bridge;
}

function main() {
  const token = process.env.TELLEM_TOKEN;
  if (!token) {
    process.stderr.write("Error: TELLEM_TOKEN environment variable is required.\n");
    process.exit(1);
  }

  runBridge({
    token,
    appUrl: process.env.TELLEM_APP_URL,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
