# DevPilot Documentation

Welcome to the DevPilot documentation. This directory contains comprehensive guides for using, understanding, and developing DevPilot.

## Quick Start

**New to DevPilot?** Start here:
1. Read [Quick Reference](./quick-reference.md) for commands and setup
2. Open [Project Overview](./project-overview-pdr.md) for feature overview
3. Run `devpilot --help` to explore commands

## Documentation Structure

### User Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [Quick Reference](./quick-reference.md) | Command syntax, common workflows, troubleshooting | Everyone |
| [Scanner & Context](./scanner-and-context.md) | How scanning works, language detection, ContextData | Users & Developers |
| [Health Scoring](./health-scoring.md) | Score calculation, 6 metrics, interpreting results | Users & Developers |
| [Dashboard & Visualization](./dashboard-and-visualization.md) | Web interface, tabs, data visualization | Users |

### Developer Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| [System Architecture](./system-architecture.md) | Module design, data flow, caching strategy | Developers |
| [Code Standards](./code-standards.md) | File structure, naming conventions, testing | Developers |
| [Project Overview & PDR](./project-overview-pdr.md) | Requirements, timeline, success metrics | Developers & PMs |

## Key Features (v1.0)

### Scanning
- **30+ Language Detection**: Extension-based + filename-based detection
- **File-Based Detection**: Makefile, Dockerfile, Jenkinsfile, etc. (NEW)
- **Code Line Counting**: Separate tracking of code vs. config lines (NEW)
- **Git Statistics**: Commits, contributors, velocity (NEW)
- **15-Minute Cache**: `--full` flag to bypass (NEW)
- **Tech Stack Detection**: Frameworks, package managers, Node version

### Health Scoring (6 Metrics - NEW)
1. **Complexity**: Cyclomatic complexity analysis
2. **Duplication**: Code duplication detection
3. **Dependencies**: Package health and vulnerabilities
4. **File Size**: Distribution and organization
5. **Test Coverage**: Coverage % + runner detection (NEW)
6. **Security**: Vulnerability audit and hardcoded secret detection (NEW)

### Dashboard (Expanded - NEW)
- **Health Card**: 0-100 score with 6-metric breakdown
- **Git Stats Card**: Commits, contributors, velocity
- **Coverage Card**: Test runner + percentage
- **Security Card**: Score + vulnerability list
- **Memory Tab**: Decisions and patterns browser
- **Reviews Tab**: Code review history

## Architecture Overview

```
Scanning Layer
├─ FileWalker         Walk files, count lines
├─ TechDetector       Detect frameworks, languages
├─ ContextBuilder     Build ContextData (30+ languages)
├─ GitAnalyzer        Extract git statistics
└─ IgnoreFilter       Apply .gitignore patterns

Health Layer
├─ ComplexityAnalyzer      Cyclomatic complexity
├─ DuplicationDetector     Code duplication
├─ DependencyChecker       Package health
├─ TestCoverageDetector    Test coverage + runner (NEW)
├─ SecurityAuditor         Security audit (NEW)
└─ ScoreCalculator         Overall score & trend

Memory Layer
├─ MemoryManager      Store decisions/patterns
└─ PatternDetector    Auto-detect patterns

Dashboard Layer
├─ Fastify Server     REST API
└─ HTML/CSS/JS UI     Real-time visualization
```

## Type System

### ContextData (Scan Output)
```typescript
interface ContextData {
  scannedAt: string;
  projectRoot: string;
  version: string;
  stats: { totalFiles, totalLines, codeLines, languages };
  techStack: { frameworks, language, packageManager, nodeVersion };
  dependencies: { runtime, dev };
  fileStructure: { directories, largestFiles };
  git?: GitStats;                    // NEW
  testCoverage?: { runner, percentage, hasConfig };  // NEW
  excludePatterns: string[];
}
```

### HealthScore (Analysis Output)
```typescript
interface HealthScore {
  scannedAt: string;
  overallScore: number;  // 0-100
  breakdown: {
    complexity, duplication, dependencies, fileSize
  };
  testCoverage: { runner?, percentage?, hasConfig };  // NEW
  security: { score, vulnerabilities };                // NEW
  trend: "improving" | "stable" | "declining";
}
```

## Data Storage

```
.devpilot/
├── shared/                 # Git-tracked (team-shared)
│   ├── config.yaml        # Project configuration
│   └── memory/
│       ├── decisions.md   # Architectural decisions
│       └── patterns.md    # Coding patterns
└── local/                  # Git-ignored (local only)
    ├── context.yaml       # Latest scan results
    ├── health.yaml        # Latest health analysis
    ├── cache/
    │   └── context.yaml   # 15-minute scan cache
    └── reviews/           # Code review reports
        └── *.md
```

## Commands Quick Reference

```bash
devpilot init                      # Initialize project
devpilot scan [--full]             # Scan codebase
devpilot health                    # Analyze health
devpilot review <path>             # AI code review
devpilot memory list               # Show decisions/patterns
devpilot memory add --type <type>  # Add decision or pattern
devpilot memory prune              # Remove stale entries
devpilot config --set-key <provider>  # Configure API key
devpilot dashboard                 # Launch web dashboard
```

## Language Support (30+)

### By Extension
TypeScript, JavaScript, Python, Java, Kotlin, Scala, Go, Rust, Ruby, PHP, Swift, C#, C, C++, Shell, SQL, R, Lua, Perl, Dart, Groovy, Elixir, Clojure, Haskell, OCaml, Markdown, JSON, YAML, CSS, SCSS, HTML

### By Filename (Extensionless)
Makefile, Dockerfile, Jenkinsfile, Vagrantfile, Rakefile, Gemfile

## LLM Provider Support

| Provider | Models | Setup |
|----------|--------|-------|
| **Anthropic** | Claude 3.5 Sonnet, 3 Opus/Sonnet | `devpilot config --set-key anthropic` |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3-mini | `devpilot config --set-key openai` |
| **Google** | Gemini 2.0 Flash, 1.5 Pro/Flash | `devpilot config --set-key google` |
| **Ollama** | Llama 3.3, Qwen 2.5, DeepSeek R1 | No key needed (local) |

## Performance Targets

| Operation | Target | Note |
|-----------|--------|------|
| Scan 10k files | < 5s | Includes caching |
| Health check | < 8s | All 6 metrics parallel |
| Dashboard load | < 2s | Real-time data |
| Memory operations | < 500ms | File-based |

## Scoring Algorithm

```
Health Score (0-100) =
  (complexity × 0.20) +
  (duplication × 0.15) +
  (dependencies × 0.15) +
  (fileSize × 0.15) +
  (testCoverage × 0.20) +
  (security × 0.15)
```

## What's New (Recent Updates)

### ContextData Enhancement
- Added `codeLines` field to track code-only line counts
- Added optional `git` field for git statistics
- Added optional `testCoverage` field for coverage metrics
- Support for file-based language detection (Makefile, Dockerfile)

### Health Scoring Expansion
- Expanded from 4 to 6 metrics
- Added test coverage detector + scoring
- Added security auditor + scoring
- Rebalanced metric weights

### Dashboard Features
- New Git Statistics tab
- New Test Coverage card
- New Security Vulnerabilities card
- Expanded Health breakdown with all 6 metrics

### Scan Command
- Added `--full` flag to bypass 15-minute cache
- Git stats collected automatically if available
- Test coverage auto-detection

## Development Workflow

### Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Read [Code Standards](./code-standards.md)
3. Follow file structure in [Code Standards](./code-standards.md)
4. Write tests using Vitest
5. Run `npm test` before committing
6. Commit with conventional format: `feat(scope): description`
7. Submit PR with test coverage report

### Testing

```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage  # Coverage report
```

### Building

```bash
npm run build         # Build CLI
npm link              # Link globally
devpilot --help       # Verify
```

## Common Issues

### Q: Scan is slow
**A:** Use `--depth` limit or `--exclude` patterns
```bash
devpilot scan --depth 5 --exclude "node_modules" --exclude "vendor"
```

### Q: Health score seems wrong
**A:** Run fresh scan with `--full` flag
```bash
devpilot scan --full
devpilot health
```

### Q: Dashboard won't load
**A:** Check if port is in use
```bash
lsof -i :3141
devpilot dashboard  # Will try next port
```

### Q: API key doesn't work
**A:** Test the key configuration
```bash
devpilot config --test-key anthropic
```

## Support & Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: See guides above
- **Examples**: Check README.md for workflow examples
- **Troubleshooting**: See [Quick Reference](./quick-reference.md)

## Release History

| Version | Date | Features |
|---------|------|----------|
| 1.0 | 2026-03-22 | Core CLI, Scanner (30+ langs), Health (6 metrics), Dashboard (expanded), Git stats, Test coverage, Security audit |
| (Upcoming) | TBD | CI/CD integration, API, Plugin system, Web dashboard |

## Documentation Index by Topic

### Getting Started
- [Quick Reference](./quick-reference.md) - Commands and setup

### Using DevPilot
- [Scanner & Context](./scanner-and-context.md) - How scanning works
- [Health Scoring](./health-scoring.md) - Understanding scores
- [Dashboard & Visualization](./dashboard-and-visualization.md) - Using the web UI

### Development
- [System Architecture](./system-architecture.md) - Technical design
- [Code Standards](./code-standards.md) - Development guidelines
- [Project Overview](./project-overview-pdr.md) - Requirements and roadmap

---

**Last Updated**: 2026-03-22
**Documentation Version**: 1.0
**DevPilot Version**: 0.1.0

For the latest information, check the [README](../README.md) in the project root.
