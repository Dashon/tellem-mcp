import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installClaudeCodeSkill, installCodexSkill, installMain } from "../dist/install.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

function npmAvailable() {
  return spawnSync("npm", ["--version"], { stdio: "ignore" }).status === 0;
}

function captureStream() {
  let text = "";
  return {
    stream: new Writable({
      write(chunk, _encoding, callback) {
        text += chunk.toString();
        callback();
      },
    }),
    get text() {
      return text;
    },
  };
}

test("installer creates the Claude Code skill folder and prints fallback config", () => {
  const homeDir = mkdtempSync(join(tmpdir(), "tellem-mcp-home-"));
  const output = captureStream();
  try {
    const result = installClaudeCodeSkill({
      token: "tellem_mcp_test",
      appUrl: "https://tellem-ten.vercel.app",
      homeDir,
      io: { stdout: output.stream },
      configureMcp: false,
    });
    const skillPath = join(homeDir, ".claude", "skills", "tellem-journal", "SKILL.md");
    const skill = readFileSync(skillPath, "utf8");

    assert.equal(result.configuredMcp, false);
    assert.match(skill, /Dated Markdown journal notes are canonical/);
    assert.match(skill, /get_agent_context/);
    assert.match(skill, /list_memory_entities/);
    assert.match(skill, /search_memory_facts/);
    assert.match(skill, /list_memory_conflicts/);
    assert.match(skill, /append_journal_note/);
    assert.match(skill, /Cite the note or source trail/);
    assert.match(skill, /Surface conflicts/);
    assert.match(skill, /Never create or rely on graph facts without evidence/);
    assert.match(skill, /do not read local file paths through MCP/i);
    assert.match(skill, /create_source_link/);
    assert.match(skill, /attach_source_to_note/);
    assert.match(skill, /list_folders/);
    assert.match(skill, /move_note_to_folder/);
    assert.match(output.text, /mcpServers/);
    assert.match(output.text, /"command": "npm"/);
    assert.match(output.text, /--package=tellem-mcp@latest/);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});

test("installer creates the Codex skill folder and prints TOML config without editing config", () => {
  const codexHomeDir = mkdtempSync(join(tmpdir(), "tellem-mcp-codex-home-"));
  const configPath = join(codexHomeDir, "config.toml");
  const existingConfig = 'model = "gpt-5"\n';
  const output = captureStream();
  try {
    writeFileSync(configPath, existingConfig);
    const result = installCodexSkill({
      token: "tellem_mcp_test",
      appUrl: "https://tellem-ten.vercel.app",
      codexHomeDir,
      io: { stdout: output.stream },
    });
    const skillPath = join(codexHomeDir, "skills", "tellem-journal", "SKILL.md");
    const skill = readFileSync(skillPath, "utf8");

    assert.equal(result.configPath, configPath);
    assert.equal(readFileSync(configPath, "utf8"), existingConfig);
    assert.match(skill, /get_agent_context/);
    assert.match(skill, /list_memory_conflicts/);
    assert.match(output.text, /Installed Tellem Journal skill/);
    assert.match(output.text, /\[mcp_servers\.tellem\]/);
    assert.match(output.text, /command = "npm"/);
    assert.match(output.text, /"exec"/);
    assert.match(output.text, /--package=tellem-mcp@latest/);
    assert.match(output.text, /TELLEM_TOKEN = "tellem_mcp_test"/);
    assert.match(output.text, /TELLEM_APP_URL = "https:\/\/tellem-ten\.vercel\.app"/);
  } finally {
    rmSync(codexHomeDir, { recursive: true, force: true });
  }
});

test("installer requires TELLEM_TOKEN for Codex install", () => {
  const stdout = captureStream();
  const stderr = captureStream();
  const previousToken = process.env.TELLEM_TOKEN;
  const previousExitCode = process.exitCode;
  try {
    delete process.env.TELLEM_TOKEN;
    process.exitCode = undefined;
    installMain(["codex"], { stdout: stdout.stream, stderr: stderr.stream });

    assert.equal(process.exitCode, 1);
    assert.equal(stdout.text, "");
    assert.match(stderr.text, /TELLEM_TOKEN/);
  } finally {
    if (previousToken === undefined) {
      delete process.env.TELLEM_TOKEN;
    } else {
      process.env.TELLEM_TOKEN = previousToken;
    }
    process.exitCode = previousExitCode;
  }
});

test("npm pack dry run includes dist, skills, readme, license, and metadata", {
  skip: !npmAvailable(),
}, () => {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const files = JSON.parse(result.stdout)[0].files.map((file) => file.path);

  assert.ok(files.includes("dist/bin.js"));
  assert.ok(files.includes("dist/install-bin.js"));
  assert.ok(files.includes("skills/tellem-journal/SKILL.md"));
  assert.ok(files.includes("gemini-extension/gemini-extension.json"));
  assert.ok(files.includes("gemini-extension/GEMINI.md"));
  assert.ok(files.includes("gemini-extension/README.md"));
  assert.ok(files.includes("README.md"));
  assert.ok(files.includes("LICENSE"));
  assert.ok(files.includes("package.json"));
});
