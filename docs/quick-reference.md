# DevPilot Quick Reference Guide

## Installation & Setup

```bash
# Clone and install
git clone <repo-url> devpilot
cd devpilot
npm install

# Build CLI
npm run build

# Link globally
cd packages/cli && npm link
cd ../..

# Verify
devpilot --version
```

## Configuration

```bash
# Set API key (required)
devpilot config --set-key anthropic
devpilot config --set-key openai
devpilot config --set-key google

# Set default model (optional)
devpilot config --set-model claude-sonnet-4-5-20250929
devpilot config --set-model openai:gpt-4o

# Test key
devpilot config --test-key anthropic

# List configured keys
devpilot config --list-keys
```

## Commands

### Scan Project

```bash
# Default scan (uses 15-min cache)
devpilot scan

# Fresh scan (bypass cache)
devpilot scan --full

# Limit directory depth
devpilot scan --depth 5

# Exclude patterns
devpilot scan --exclude "vendor" --exclude "node_modules"

# Combine options
devpilot scan --full --depth 8 --exclude "vendor"
```

**Output:** Context data with file counts, LOC, tech stack, git stats

### Health Check

```bash
# Analyze project health
devpilot health
```

**Output:** 0-100 health score with 6-metric breakdown:
- Complexity
- Duplication
- Dependencies
- File Size
- Test Coverage (NEW)
- Security (NEW)

### Code Review

```bash
# Review single file
devpilot review src/lib/auth.ts

# Review directory
devpilot review src/

# Use specific model
devpilot review src/ --model openai:gpt-4o

# Use specific provider
devpilot review src/ --model google:gemini-2.0-flash
```

**Output:** Markdown report saved to `.devpilot/local/reviews/`

### Memory Management

```bash
# List decisions and patterns
devpilot memory list

# Add a decision
devpilot memory add --type decision
# → Prompts: Title, Decision, Rationale

# Add a pattern
devpilot memory add --type pattern
# → Prompts: Name, Category, Description

# Remove stale entries (> 30 days)
devpilot memory prune

# Estimate token usage
devpilot memory tokens
```

### Dashboard

```bash
# Start web dashboard
devpilot dashboard

# Access at http://localhost:3141
# Shows: Health, Git, Coverage, Security, Memory, Reviews
```

### Initialize Project

```bash
# Create .devpilot/ directory structure
devpilot init

# Creates:
# .devpilot/shared/    (git-tracked)
# .devpilot/local/     (git-ignored)
```

## File Structure

```
.devpilot/
├── shared/                    # Git-tracked
│   ├── config.yaml
│   └── memory/
│       ├── decisions.md
│       └── patterns.md
└── local/                     # Git-ignored
    ├── context.yaml           # Scan results
    ├── health.yaml            # Health analysis
    ├── cache/
    │   └── context.yaml       # 15-min cache
    └── reviews/
        └── *.md               # Review reports
```

## ContextData Fields

```yaml
# Scan output (.devpilot/local/context.yaml)
scannedAt: "2026-03-22T15:30:45Z"
projectRoot: /path/to/project
version: "1.0"

stats:
  totalFiles: 245
  totalLines: 12450
  codeLines: 9800           # NEW: Code-only lines
  languages:
    typescript: { files: 145, lines: 8900 }
    # ... more languages

techStack:
  frameworks: ["react", "next.js"]
  language: "typescript"
  packageManager: "npm"
  nodeVersion: ">=18.0.0"

dependencies:
  runtime: { react: "^18.2.0", ... }
  dev: { typescript: "^5.0.0", ... }

fileStructure:
  directories: 42
  largestFiles: [{ path: "...", lines: 487, size: 12420 }]

git:                          # NEW: Optional
  commits: 287
  contributors: 5
  branches: 12
  currentBranch: "main"
  firstCommit: "2025-06-15T10:00:00Z"
  lastCommit: "2026-03-22T14:30:00Z"
  commitsPerWeek: 8.5

testCoverage:                 # NEW: Optional
  runner: "jest"
  percentage: 76
  hasConfig: true

excludePatterns: ["node_modules", ".git"]
```

## Health Score Breakdown

```yaml
# Health analysis (.devpilot/local/health.yaml)
overallScore: 78              # 0-100

breakdown:
  complexity: 82              # Cyclomatic complexity
  duplication: 75             # Code duplication %
  dependencies: 88            # Dependency health
  fileSize: 72                # File size distribution

testCoverage:                 # NEW
  runner: "jest"
  percentage: 76
  hasConfig: true

security:                     # NEW
  score: 85
  vulnerabilities:
    - type: "hardcoded-secret"
      severity: "high"
      path: "src/config.ts:42"

trend: "improving"            # improving | stable | declining
```

## Language Detection (30+)

**By Extension (25+):**
- TypeScript: ts, tsx
- JavaScript: js, jsx, mjs, cjs
- Python: py, pyw
- Java: java
- Kotlin: kt
- Go: go
- Rust: rs
- Ruby: rb
- PHP: php
- Swift: swift
- C#: cs
- C/C++: c, h, cpp, cc, cxx, hpp
- Shell: sh, bash, zsh
- SQL: sql
- R: r, R
- Lua: lua
- Perl: pl, pm
- Dart: dart
- Groovy: groovy
- Elixir: ex, exs
- Clojure: clj, cljs
- Haskell: hs
- OCaml: ml, mli
- Markdown: md
- JSON: json
- YAML: yaml, yml
- CSS/SCSS: css, scss
- HTML: html

**By Filename (extensionless):**
- Makefile → make
- Dockerfile → docker
- Jenkinsfile → groovy
- Vagrantfile → ruby
- Rakefile → ruby
- Gemfile → ruby

## Health Scoring Algorithm

```
overallScore =
  (complexity × 0.20) +
  (duplication × 0.15) +
  (dependencies × 0.15) +
  (fileSize × 0.15) +
  (testCoverage × 0.20) +
  (security × 0.15)
```

**Score Interpretation:**
- **90-100**: Excellent
- **75-89**: Good
- **60-74**: Fair
- **45-59**: Poor
- **0-44**: Critical

## Environment Variables

```bash
# API Keys (alternative to config file)
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GOOGLE_GENERATIVE_AI_API_KEY=...

# Optional: Ollama endpoint
export OLLAMA_BASE_URL=http://localhost:11434
```

## Test Coverage Runners Supported

- **JavaScript**: jest, vitest, mocha, ava
- **Python**: pytest, unittest
- **Go**: testing (built-in)
- **Java**: junit, testng

## Common Workflow

```bash
# 1. Initialize project
devpilot init
devpilot config --set-key anthropic

# 2. First scan
devpilot scan

# 3. Check health
devpilot health

# 4. Review critical files
devpilot review src/lib/
devpilot review src/api/

# 5. Record decisions
devpilot memory add --type decision
# → Use Fastify over Express

# 6. View everything
devpilot dashboard
# → Opens http://localhost:3141

# 7. Periodic health checks
devpilot health        # Weekly
devpilot scan --full   # Weekly
devpilot review src/   # As needed
```

## CI/CD Integration Example

```bash
#!/bin/bash
# ci-review.sh

# Scan with fresh data
devpilot scan --full

# Check health
HEALTH=$(devpilot health)
echo "$HEALTH"

# Review changed files
for file in $(git diff --name-only HEAD~1 -- '*.ts' '*.tsx'); do
  devpilot review "$file"
done

# Exit with error if health < 60
SCORE=$(echo "$HEALTH" | grep "overallScore" | cut -d' ' -f2)
if (( $(echo "$SCORE < 60" | bc -l) )); then
  echo "Health score too low: $SCORE"
  exit 1
fi
```

## Troubleshooting

### Scan Takes Too Long

```bash
# Limit depth
devpilot scan --depth 5

# Exclude vendor dirs
devpilot scan --exclude "node_modules" --exclude "vendor"

# Force use of cache
devpilot scan  # Uses cache if < 15 min old
```

### Health Check Fails

```bash
# Ensure context exists
devpilot scan --full

# Check for permission errors
ls -la .devpilot/local/

# Try again
devpilot health
```

### Dashboard Won't Start

```bash
# Check if port 3141 is in use
lsof -i :3141

# Kill process
kill -9 <PID>

# Start dashboard
devpilot dashboard
```

### API Key Not Working

```bash
# Test the key
devpilot config --test-key anthropic

# Verify it's set
devpilot config --list-keys

# Reset if needed
devpilot config --set-key anthropic
```

## API Providers & Models

### Anthropic

```bash
devpilot config --set-key anthropic
devpilot config --set-model claude-sonnet-4-5-20250929
# Or: claude-3-opus-20250514, claude-3-sonnet-20250229
```

### OpenAI

```bash
devpilot config --set-key openai
devpilot config --set-model openai:gpt-4o
# Or: openai:gpt-4o-mini, openai:o1, openai:o3-mini
```

### Google

```bash
devpilot config --set-key google
devpilot config --set-model google:gemini-2.0-flash
# Or: google:gemini-1.5-pro, google:gemini-1.5-flash
```

### Ollama (Local)

```bash
# No key needed, runs locally
devpilot config --set-model ollama:llama2
# Or: ollama:qwen2.5, ollama:deepseek-r1
```

## File Limits

- **File size limit**: Files > 10 MB skipped during scanning
- **Max depth**: Default 10 levels (configurable with --depth)
- **API limits**: Respect provider rate limits (use cache)

## Performance Targets

| Operation | Target Time |
|-----------|-------------|
| Scan 10k files | < 5s |
| Health check | < 8s |
| Dashboard load | < 2s |
| Memory operations | < 500ms |

## Further Reading

- [System Architecture](./system-architecture.md) - High-level design
- [Scanner & Context](./scanner-and-context.md) - Scanning details
- [Health Scoring](./health-scoring.md) - Scoring algorithm
- [Dashboard & Visualization](./dashboard-and-visualization.md) - UI guide
- [Code Standards](./code-standards.md) - Development guidelines
- [Project Overview](./project-overview-pdr.md) - Requirements & roadmap

---

**Last Updated**: 2026-03-22
**Version**: 1.0
