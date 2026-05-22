import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultAppUrl = "https://tellem-ten.vercel.app";
const serverPackage = "tellem-mcp@latest";

type InstallIo = {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
};

function packageRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

function fallbackConfig({ token, appUrl }: { token: string; appUrl: string }) {
  return {
    mcpServers: {
      tellem: {
        command: "npm",
        args: ["exec", "--yes", `--package=${serverPackage}`, "--", "tellem-mcp"],
        env: {
          TELLEM_TOKEN: token,
          TELLEM_APP_URL: appUrl,
        },
      },
    },
  };
}

function codexConfigToml({ token, appUrl }: { token: string; appUrl: string }) {
  const args = ["exec", "--yes", `--package=${serverPackage}`, "--", "tellem-mcp"];
  return [
    "[mcp_servers.tellem]",
    'command = "npm"',
    `args = ${JSON.stringify(args)}`,
    "enabled = true",
    "",
    "[mcp_servers.tellem.env]",
    `TELLEM_TOKEN = ${JSON.stringify(token)}`,
    `TELLEM_APP_URL = ${JSON.stringify(appUrl)}`,
    "",
  ].join("\n");
}

function claudeCliAvailable() {
  const result = spawnSync("claude", ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function configureClaudeMcp({ token, appUrl }: { token: string; appUrl: string }) {
  return spawnSync(
    "claude",
    [
      "mcp",
      "add",
      "--transport",
      "stdio",
      "--env",
      `TELLEM_TOKEN=${token}`,
      "--env",
      `TELLEM_APP_URL=${appUrl}`,
      "--scope",
      "user",
      "tellem",
      "--",
      "npm",
      "exec",
      "--yes",
      `--package=${serverPackage}`,
      "--",
      "tellem-mcp",
    ],
    { stdio: "inherit" },
  );
}

export function installClaudeCodeSkill({
  token,
  appUrl = defaultAppUrl,
  homeDir = homedir(),
  io = {},
  configureMcp = true,
}: {
  token: string;
  appUrl?: string;
  homeDir?: string;
  io?: InstallIo;
  configureMcp?: boolean;
}) {
  const stdout = io.stdout ?? process.stdout;
  const sourceDir = join(packageRoot(), "skills", "tellem-journal");
  const targetDir = join(homeDir, ".claude", "skills", "tellem-journal");
  mkdirSync(dirname(targetDir), { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
  stdout.write(`Installed Tellem Journal skill to ${targetDir}\n`);

  if (configureMcp && claudeCliAvailable()) {
    const result = configureClaudeMcp({ token, appUrl });
    if (result.status === 0) {
      stdout.write("Configured Claude Code MCP server: tellem\n");
      return { installedSkillDir: targetDir, configuredMcp: true };
    }
    stdout.write("Claude CLI was found, but MCP configuration failed. Use this manual config:\n");
  } else {
    stdout.write("Claude CLI was not found. Use this manual MCP config:\n");
  }

  stdout.write(`${JSON.stringify(fallbackConfig({ token, appUrl }), null, 2)}\n`);
  return { installedSkillDir: targetDir, configuredMcp: false };
}

export function installCodexSkill({
  token,
  appUrl = defaultAppUrl,
  codexHomeDir = process.env.CODEX_HOME || join(homedir(), ".codex"),
  io = {},
}: {
  token: string;
  appUrl?: string;
  codexHomeDir?: string;
  io?: InstallIo;
}) {
  const stdout = io.stdout ?? process.stdout;
  const sourceDir = join(packageRoot(), "skills", "tellem-journal");
  const targetDir = join(codexHomeDir, "skills", "tellem-journal");
  const configPath = join(codexHomeDir, "config.toml");
  mkdirSync(dirname(targetDir), { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
  stdout.write(`Installed Tellem Journal skill to ${targetDir}\n`);
  stdout.write(`Add this to ${configPath}, then restart Codex:\n`);
  stdout.write(`${codexConfigToml({ token, appUrl })}\n`);
  return { installedSkillDir: targetDir, configPath };
}

export function installMain(argv = process.argv.slice(2), io: InstallIo = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const target = argv[0];
  if (target !== "claude-code" && target !== "codex") {
    stderr.write("Usage: tellem-mcp install <claude-code|codex>\n");
    process.exitCode = 1;
    return;
  }

  const token = process.env.TELLEM_TOKEN;
  if (!token) {
    stderr.write("Error: TELLEM_TOKEN environment variable is required.\n");
    process.exitCode = 1;
    return;
  }

  const appUrl = process.env.TELLEM_APP_URL || defaultAppUrl;
  if (target === "claude-code") {
    installClaudeCodeSkill({ token, appUrl, io: { stdout, stderr } });
    return;
  }

  installCodexSkill({ token, appUrl, io: { stdout, stderr } });
}
