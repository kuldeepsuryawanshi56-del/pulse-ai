# Pulse AI — VS Code Extension

Operational memory for AI coding. Capture decisions, dead-ends, and patterns from every session.

## Setup

1. Run `npx @glie/pulse-cli init` in your terminal
2. Install this extension
3. Done — the extension reads your config automatically

## Features

- **Watcher** — monitors commits and AI sessions, generates insight drafts via LLM
- **Drafts sidebar** — review, edit, publish or discard generated insights
- **Search** — full-text + semantic search across your knowledge base (`Ctrl+Shift+K`)
- **CodeLens** — inline annotations showing related insights on source files
- **MCP setup** — `Ctrl+Shift+P` → "Pulse: Setup MCP in this folder"

## Commands

| Command | Description |
|---------|-------------|
| `Pulse: Search Knowledge Base` | Search insights (`Ctrl+Shift+K`) |
| `Pulse: Create Insight` | Manually create an insight |
| `Pulse: Publish & Push` | Publish local drafts to the server |
| `Pulse: Setup MCP in this folder` | Configure MCP for Claude Code / Codex |
| `Pulse: Start/Stop Watcher` | Toggle automatic insight generation |

## Configuration

The extension reads from `~/.pulse/config.json` (created by `pulse init`). No VS Code settings needed.

Optional VS Code settings for LLM:

| Setting | Description |
|---------|-------------|
| `pulse.llmProvider` | `auto` (default), `anthropic`, or `openai` |
| `pulse.llmApiKey` | API key for direct LLM fallback |
| `pulse.llmModel` | Model override |

## Links

- [GitHub](https://github.com/glieai/pulse-ai)
- [Documentation](https://github.com/glieai/pulse-ai#readme)
- [Report Issues](https://github.com/glieai/pulse-ai/issues)
