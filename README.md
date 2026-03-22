# DevPilot

AI Dev Copilot with persistent project memory, code quality scoring, and AI-powered reviews.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- An API key from one of: Anthropic, OpenAI, Google, or a local Ollama instance

## Setup

```bash
# 1. Clone and install
git clone <repo-url> devpilot
cd devpilot
npm install

# 2. Build the CLI
npm run build

# 3. Link globally so you can use `devpilot` anywhere
cd packages/cli && npm link
cd ../..

# 4. Verify installation
devpilot --version   # → 0.1.0
devpilot --help
```

## Configuration

```bash
# Set your API key (choose one provider)
devpilot config --set-key anthropic    # prompts for Anthropic API key
devpilot config --set-key openai       # prompts for OpenAI API key
devpilot config --set-key google       # prompts for Google API key

# Set default model (optional)
devpilot config --set-model claude-sonnet-4-5-20250929

# Or use provider:model format
devpilot config --set-model openai:gpt-4o

# Verify your key works
devpilot config --test-key anthropic

# List configured keys
devpilot config --list-keys
```

API keys are stored in `~/.devpilot/config.yaml` with restricted permissions (owner-only read/write).

You can also set keys via environment variables:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Usage

### Initialize a project

```bash
cd /path/to/your-project
devpilot init
```

Creates `.devpilot/shared/` (git-tracked) and `.devpilot/local/` (git-ignored) directories.

### Scan codebase

```bash
devpilot scan                      # default scan
devpilot scan --depth 5            # limit depth
devpilot scan --exclude "vendor"   # exclude patterns
devpilot scan --full               # bypass cache
```

Detects tech stack, counts files/lines, auto-discovers coding patterns.

### AI code review

```bash
devpilot review src/lib/auth.ts           # review a single file
devpilot review src/                       # review entire directory
devpilot review src/ --model openai:gpt-4o # use specific model
```

Reviews are saved to `.devpilot/local/reviews/` as markdown files. Target must be within the project directory.

### Project health

```bash
devpilot health
```

Analyzes complexity, duplication, dependencies, and file sizes. Outputs a 0-100 score with trend tracking.

### Memory (decisions & patterns)

```bash
devpilot memory list                   # show all decisions and patterns
devpilot memory add --type decision    # record an architecture decision
devpilot memory add --type pattern     # record a coding pattern
devpilot memory prune                  # remove stale memories
devpilot memory tokens                 # show token usage estimate
```

### Dashboard

```bash
devpilot dashboard
```

Opens a web dashboard at `http://localhost:3141` with tabs for Health, Context, Memory, and Reviews.

## Commands Reference

| Command | Description |
|---------|-------------|
| `devpilot init` | Initialize `.devpilot/` in current project |
| `devpilot scan` | Scan codebase, detect tech stack, analyze structure |
| `devpilot memory <action>` | Manage project memory (list, add, prune, tokens) |
| `devpilot config` | Manage API keys and default model |
| `devpilot review <target>` | AI-powered code review |
| `devpilot health` | Analyze project health (0-100 score) |
| `devpilot dashboard` | Launch web dashboard on localhost:3141 |

## Example: Full Workflow

```bash
# Setup a new project
cd ~/projects/my-app
devpilot init
devpilot config --set-key anthropic

# Scan and analyze
devpilot scan
devpilot health

# Review code
devpilot review src/api/
devpilot review src/utils/helpers.ts

# Record a decision
devpilot memory add --type decision
# → Title: Use Fastify over Express
# → Decision: Chose Fastify for API server
# → Rationale: Better performance, schema validation built-in

# Launch dashboard to see everything
devpilot dashboard
```

## Example: CI Integration

```bash
#!/bin/bash
# ci-review.sh — run in CI pipeline
devpilot scan --full
devpilot health

# Review changed files
for file in $(git diff --name-only HEAD~1 -- '*.ts' '*.tsx'); do
  devpilot review "$file"
done
```

## Architecture

```
devpilot/
├── packages/
│   ├── cli/          # Node.js CLI (Commander.js + TypeScript)
│   └── web/          # Dashboard (placeholder)
└── .devpilot/        # Per-project data
    ├── shared/       # Git-tracked (decisions, patterns, config)
    │   ├── config.yaml
    │   └── memory/
    │       ├── decisions.yaml
    │       └── patterns.yaml
    └── local/        # Git-ignored (reviews, health, cache)
        ├── reviews/
        ├── health.yaml
        └── cache/
```

## LLM Providers

Supports BYOK (Bring Your Own Key):

| Provider | Models | Setup |
|----------|--------|-------|
| **Anthropic** | Claude Sonnet 4.5, Claude 3.5, Claude 3 Opus | `devpilot config --set-key anthropic` |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3-mini | `devpilot config --set-key openai` |
| **Google** | Gemini 2.0 Flash, Gemini 1.5 Pro/Flash | `devpilot config --set-key google` |
| **Ollama** | Llama 3.3, Qwen 2.5, DeepSeek R1 | Local — no key needed |

## Limits

- File size: Files larger than 10 MB are skipped during scanning
- Review target must be within the project directory (no path traversal)
- Dashboard runs on localhost only (127.0.0.1)

## Tech Stack

- CLI: Commander.js, tsup, fdir, Vercel AI SDK
- Dashboard: Fastify API server + inline HTML
- Storage: YAML/MD files (no database)
- Build: npm workspaces monorepo
- Tests: Vitest

## Development

```bash
npm install          # install all dependencies
npm run build        # build CLI
npm test             # run tests (33 tests across 6 files)
```

## License

MIT
