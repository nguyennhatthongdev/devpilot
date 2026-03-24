# DevPilot: AI Dev Copilot with Code Intelligence

## Project Overview

DevPilot is an AI-powered CLI tool that provides persistent project memory, code quality scoring, and AI-powered code reviews. It integrates with multiple LLM providers to help development teams maintain code health, track architectural decisions, and automate code analysis.

**Version:** 0.1.0

### Core Features

- **Codebase Scanning**: Multi-language detection (30+ languages) with file-based and extension-based detection
- **Health Scoring**: 6-metric health analysis covering complexity, duplication, dependencies, file size, test coverage, and security
- **Project Memory**: Persistent storage of architectural decisions and coding patterns
- **AI Code Review**: Context-aware reviews using Claude, GPT-4, Gemini, or Ollama
- **Dashboard**: Web-based visualization of project health, memory, and analysis
- **Git Integration**: Real-time git statistics (commits, contributors, velocity)
- **Test Coverage Detection**: Automatic test coverage identification and tracking
- **Security Auditing**: Vulnerability detection and security scoring

## Product Development Requirements

### Functional Requirements

1. **Scan Projects**
   - Walk file systems with configurable depth limits
   - Detect 30+ programming languages by extension and filename
   - Extract technology stack (frameworks, package managers, node version)
   - Count total files, lines of code, and code-specific lines
   - Generate largest files report
   - Collect git statistics (commits, contributors, branches)
   - Identify test coverage configuration
   - Run security audit checks
   - Cache results for 15 minutes (bypass with `--full` flag)

2. **Health Analysis**
   - Calculate complexity score from cyclomatic complexity
   - Detect code duplication across files
   - Analyze dependency health (outdated, unused)
   - Score file size distribution
   - Evaluate test coverage percentage
   - Audit security issues and vulnerabilities
   - Track trend over time (improving/declining/stable)
   - Generate 0-100 health score with 6-metric breakdown

3. **Memory Management**
   - Record architectural decisions in markdown format
   - Track coding patterns and conventions
   - Auto-detect patterns from scan results
   - Prune stale memories (> 30 days)
   - Estimate token usage for context window
   - Support full-text search

4. **Code Review**
   - Review single files or directories
   - Use configurable LLM providers and models
   - Generate markdown review reports
   - Save reviews with timestamp and file hash

5. **Dashboard**
   - Real-time project health visualization
   - Git statistics and trends
   - Memory browser (decisions & patterns)
   - Review history
   - Test coverage metrics
   - Security score card
   - Localhost-only access (127.0.0.1)

### Non-Functional Requirements

- **Performance**: Cache results for 15 minutes to reduce repeated scanning
- **Security**: Restrict dashboard to localhost; store API keys with owner-only permissions
- **Reliability**: Graceful error handling for missing git repos or uninitialized projects
- **Scalability**: Support large projects (tested on 10MB+ codebases)
- **Portability**: Work across Node.js 18+ on macOS, Linux, Windows
- **Modularity**: Separate scanner, health, memory, and review modules for maintainability

### Acceptance Criteria

- [ ] Scan accurately detects 30+ languages with correct file counts
- [ ] Health score remains stable when re-run on same codebase
- [ ] Git stats sync with actual repo state
- [ ] Dashboard loads within 2 seconds on projects < 100k LOC
- [ ] Test coverage auto-detection works for Jest, Vitest, Mocha
- [ ] Security audit identifies common vulnerabilities (hardcoded secrets, etc.)
- [ ] Memory prune removes only entries older than 30 days
- [ ] API key storage has 600 permissions (owner-only read/write)
- [ ] Cache is bypassed when `--full` flag is used
- [ ] Health metrics explain their contribution to overall score

## Technology Stack

### Frontend
- Fastify (API server)
- Inline HTML/CSS/JS (single-file dashboard)
- No external UI framework dependencies

### Backend
- Node.js 18+
- Commander.js (CLI)
- TypeScript
- Vitest (testing)

### Storage
- YAML/Markdown (no database)
- File-system based (.devpilot/shared, .devpilot/local)

### LLM Integration
- Vercel AI SDK (unified interface)
- Anthropic Claude (Sonnet, Opus, Haiku)
- OpenAI GPT-4o, o1, o3-mini
- Google Gemini Flash, Pro
- Ollama (self-hosted)

### File System
- fdir (file discovery)
- fs/promises (async operations)
- path (cross-platform paths)

## Architecture

### Directory Structure

```
devpilot/
├── packages/
│   ├── cli/              # Main CLI application
│   │   ├── src/
│   │   │   ├── actions/  # Action handlers (scan, health, review, memory)
│   │   │   ├── commands/ # CLI command definitions
│   │   │   ├── lib/      # Core modules
│   │   │   │   ├── scanner/   # File scanning and tech detection
│   │   │   │   ├── health/    # Health analysis and scoring
│   │   │   │   ├── memory/    # Decision and pattern storage
│   │   │   │   ├── server/    # Dashboard server and routes
│   │   │   │   └── llm/       # LLM provider integration
│   │   │   └── index.ts  # CLI entry point
│   │   └── tests/        # Unit tests
│   └── web/              # Placeholder for future web app
└── .devpilot/            # Per-project data (created by init)
    ├── shared/           # Git-tracked memory and config
    │   ├── config.yaml
    │   └── memory/
    │       ├── decisions.md
    │       └── patterns.md
    └── local/            # Git-ignored analysis and cache
        ├── context.yaml  # Latest scan results
        ├── health.yaml   # Latest health analysis
        ├── cache/        # Scan cache
        └── reviews/      # Code review reports
```

### Module Responsibilities

| Module | Purpose |
|--------|---------|
| **FileWalker** | Traverse file system, count lines, calculate file sizes |
| **TechDetector** | Identify frameworks, languages, package managers from files |
| **ContextBuilder** | Aggregate scan data into ContextData structure |
| **GitAnalyzer** | Extract commit history, contributors, branch stats |
| **ComplexityAnalyzer** | Calculate cyclomatic complexity per file |
| **DuplicationDetector** | Find code duplication patterns |
| **TestCoverageDetector** | Detect Jest, Vitest, Mocha configurations |
| **SecurityAuditor** | Identify vulnerabilities and secrets |
| **ScoreCalculator** | Compute health score and trend |
| **MemoryManager** | Read/write decisions and patterns |
| **PatternDetector** | Auto-detect coding patterns from context |
| **ConfigManager** | Load and merge configuration from files |

## Success Metrics

- **Accuracy**: Language detection > 95% on multi-language projects
- **Performance**: Scan < 5 seconds for 10k files; health check < 8 seconds
- **Reliability**: < 1% error rate on initialization, scanning, health checks
- **Adoption**: Used in 3+ internal projects within Q2 2026
- **Code Quality**: 80%+ test coverage; 0 critical security issues

## Timeline

| Phase | Status | Target |
|-------|--------|--------|
| Core CLI & Scanner | Complete | 2026-03-22 |
| Health Scoring & Dashboard | Complete | 2026-03-22 |
| Memory & Review Features | Complete | 2026-03-22 |
| Test Coverage & Security | Complete | 2026-03-22 |
| CI Integration & Docs | In Progress | 2026-04-15 |
| Production Release | Pending | 2026-05-01 |

## Dependencies & Constraints

- **Node.js**: >= 18 (requires Promise.all, async/await)
- **npm**: >= 9 (workspaces support)
- **Git**: Optional but required for git stats
- **LLM API**: Required for review and memory features

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM API rate limiting | High | Implement backoff and caching |
| Missing git repo | Medium | Graceful fallback; skip git stats |
| Large file processing | Medium | Skip files > 10 MB; limit depth |
| Dashboard port conflicts | Low | Dynamic port allocation |

---

**Last Updated**: 2026-03-22
**Owner**: DevPilot Team
**Status**: Active Development
