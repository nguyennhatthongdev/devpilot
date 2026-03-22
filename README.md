# DevPilot

AI Dev Copilot with persistent project memory, code quality scoring, and AI-powered reviews.

## Quick Start

```bash
# Install dependencies
npm install

# Build CLI
npm run build

# Link globally (optional)
cd packages/cli && npm link

# Initialize in your project
devpilot init

# Scan codebase
devpilot scan

# Run health analysis
devpilot health

# Launch dashboard
devpilot dashboard
```

## Commands

| Command | Description |
|---------|-------------|
| `devpilot init` | Initialize `.devpilot/` in current project |
| `devpilot scan` | Scan codebase, detect tech stack, analyze structure |
| `devpilot memory list` | Show decisions and patterns |
| `devpilot memory add --type decision` | Add architecture decision |
| `devpilot memory add --type pattern` | Add coding pattern |
| `devpilot memory tokens` | Show token usage estimate |
| `devpilot config --set-key anthropic` | Set API key for LLM provider |
| `devpilot config --set-model <model>` | Set default LLM model |
| `devpilot review <file\|dir>` | AI-powered code review |
| `devpilot health` | Analyze project health (0-100 score) |
| `devpilot dashboard` | Launch web dashboard on localhost:3141 |

## Architecture

```
devpilot/
├── packages/
│   ├── cli/          # Node.js CLI (Commander.js + TypeScript)
│   └── web/          # Dashboard (placeholder for Next.js)
└── .devpilot/
    ├── shared/       # Git-tracked (decisions, patterns, config)
    └── local/        # Git-ignored (reviews, health, cache)
```

## LLM Providers

Supports BYOK (Bring Your Own Key) with:
- **Anthropic** (Claude)
- **OpenAI** (GPT-4o)
- **Google** (Gemini)
- **Ollama** (local models)

## Tech Stack

- CLI: Commander.js, tsup, fdir, Vercel AI SDK
- Dashboard: Fastify API server + inline HTML
- Storage: YAML/MD files (no database)
- Build: npm workspaces monorepo

## License

MIT
