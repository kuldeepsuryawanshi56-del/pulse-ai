import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { c, error, info, success } from "../output";

interface McpConfig {
	mcpServers: Record<
		string,
		{
			type: string;
			command: string;
			args: string[];
			env?: Record<string, string>;
		}
	>;
}

const HOME = homedir();
const CLAUDE_DIR = join(HOME, ".claude");
const MCP_JSON_PATH = join(CLAUDE_DIR, ".mcp.json");
const CODEX_DIR = join(HOME, ".codex");
const CODEX_CONFIG_PATH = join(CODEX_DIR, "config.toml");

/** Normalize API URL to always end with /api */
function normalizeApiUrl(apiUrl: string): string {
	let url = apiUrl.replace(/\/+$/, "");
	if (!url.endsWith("/api")) url += "/api";
	return url;
}

/**
 * Configure Pulse MCP server globally for Claude Code.
 * Writes ~/.claude/.mcp.json + ~/.claude/settings.json.
 */
function setupClaudeCode(normalizedUrl: string, token: string): void {
	if (!existsSync(CLAUDE_DIR)) {
		mkdirSync(CLAUDE_DIR, { recursive: true });
	}

	// .mcp.json
	let mcpConfig: McpConfig = { mcpServers: {} };
	if (existsSync(MCP_JSON_PATH)) {
		try {
			mcpConfig = JSON.parse(readFileSync(MCP_JSON_PATH, "utf-8"));
		} catch {}
	}

	mcpConfig.mcpServers.pulse = {
		type: "stdio",
		command: "npx",
		args: ["-y", "@glie/pulse-mcp@latest"],
		env: {
			PULSE_API_URL: normalizedUrl,
			PULSE_API_TOKEN: token,
		},
	};
	writeFileSync(MCP_JSON_PATH, `${JSON.stringify(mcpConfig, null, "\t")}\n`);
}

/**
 * Configure Pulse MCP server globally for Codex.
 * Appends/updates [mcp_servers.pulse] in ~/.codex/config.toml.
 */
function setupCodex(normalizedUrl: string, token: string): void {
	if (!existsSync(CODEX_DIR)) {
		mkdirSync(CODEX_DIR, { recursive: true });
	}

	let toml = "";
	if (existsSync(CODEX_CONFIG_PATH)) {
		toml = readFileSync(CODEX_CONFIG_PATH, "utf-8");
	}

	const block = [
		"[mcp_servers.pulse]",
		'command = "npx"',
		'args = ["-y", "@glie/pulse-mcp"]',
		"",
		"[mcp_servers.pulse.env]",
		`PULSE_API_URL = "${normalizedUrl}"`,
		`PULSE_API_TOKEN = "${token}"`,
	].join("\n");

	if (toml.includes("[mcp_servers.pulse]")) {
		const replaced = toml.replace(
			/\[mcp_servers\.pulse\][\s\S]*?(?=\n\[(?!mcp_servers\.pulse)|$)/,
			`${block}\n`,
		);
		if (replaced !== toml) {
			writeFileSync(CODEX_CONFIG_PATH, replaced);
		}
	} else {
		const separator = toml.length > 0 && !toml.endsWith("\n\n") ? "\n\n" : "\n";
		writeFileSync(CODEX_CONFIG_PATH, `${toml}${separator}${block}\n`);
	}
}

/**
 * Create a local .mcp.json in the current working directory.
 * Claude Code reads local .mcp.json reliably per-folder.
 */
function setupLocalMcp(normalizedUrl: string, token: string): void {
	const localPath = join(process.cwd(), ".mcp.json");
	let mcpConfig: McpConfig = { mcpServers: {} };
	if (existsSync(localPath)) {
		try {
			mcpConfig = JSON.parse(readFileSync(localPath, "utf-8"));
		} catch {}
	}

	mcpConfig.mcpServers.pulse = {
		type: "stdio",
		command: "npx",
		args: ["-y", "@glie/pulse-mcp@latest"],
		env: {
			PULSE_API_URL: normalizedUrl,
			PULSE_API_TOKEN: token,
		},
	};
	writeFileSync(localPath, `${JSON.stringify(mcpConfig, null, "\t")}\n`);
}

/**
 * Configure Pulse MCP server for Claude Code and Codex.
 * Creates both local .mcp.json and global configs.
 */
export function setupGlobalMcp(apiUrl: string, token: string): boolean {
	const normalizedUrl = normalizeApiUrl(apiUrl);

	try {
		setupLocalMcp(normalizedUrl, token);
	} catch {}

	try {
		setupClaudeCode(normalizedUrl, token);
	} catch {}

	try {
		setupCodex(normalizedUrl, token);
	} catch {}

	return true;
}

/** Standalone command for setting up MCP integration */
export default async function setupMcpCommand(args: string[]): Promise<void> {
	const apiUrl = args[0];
	const token = args[1];

	if (!apiUrl || !token) {
		error("Usage: pulse setup-mcp <api-url> <token>");
		info("  Or run 'pulse init' for full interactive setup");
		process.exit(1);
	}

	const ok = setupGlobalMcp(apiUrl, token);
	if (ok) {
		success("MCP integration configured globally");
		info(`  ${c.dim("Claude Code:")} ~/.claude/.mcp.json + settings.json`);
		info(`  ${c.dim("Codex:")} ~/.codex/config.toml`);
		console.log("");
		info("Restart Claude Code / Codex to activate the Pulse tools.");
	}
}
