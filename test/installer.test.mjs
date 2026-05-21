import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installClaudeCodeSkill } from "../dist/install.js";

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
    assert.match(skill, /source of truth/i);
    assert.match(skill, /create_source_link/);
    assert.match(skill, /attach_source_to_note/);
    assert.match(skill, /list_folders/);
    assert.match(skill, /move_note_to_folder/);
    assert.match(output.text, /mcpServers/);
    assert.match(output.text, /tellem-mcp@latest/);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
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
  assert.ok(files.includes("README.md"));
  assert.ok(files.includes("LICENSE"));
  assert.ok(files.includes("package.json"));
});
