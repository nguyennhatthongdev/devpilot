# DevPilot System Architecture

## High-Level Overview

DevPilot follows a modular, layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│              (Commands: scan, health, review)            │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│                  Action Layer                            │
│  (ScanProjectAction, RunHealthCheckAction, etc.)         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│            Core Analysis Modules                         │
├─────────────────┬──────────────────┬─────────────────────┤
│   Scanner       │      Health      │      Memory         │
│   • FileWalker  │   • Complexity   │  • Decisions        │
│   • TechDetector│   • Duplication  │  • Patterns         │
│   • ContextBldr │   • Dependencies │  • PatternDetector  │
│   • GitAnalyzer │   • Coverage     │                     │
│                 │   • Security     │                     │
└─────────────────┴──────────────────┴─────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│            Storage & Configuration                      │
│   • ConfigManager  • MemoryManager  • FileUtils         │
└──────────────────────────────────────────────────────────┘
```

## Component Architecture

### Scanner Module

**Purpose**: Traverse codebase, extract metadata, detect technology stack.

```
FileWalker
  ├─ walk(rootPath, maxDepth)
  ├─ countLines(filePath)
  └─ getFileSize(filePath)
       ↓
TechDetector
  ├─ detect(rootPath, files) → TechStack
  ├─ extractDependencies(rootPath)
  └─ [Framework detection from config files]
       ↓
ContextBuilder
  ├─ build(files, rootPath, techStack, deps, excludePatterns) → ContextData
  ├─ [30+ language detection by ext & filename]
  └─ [Largest files analysis, directory counting]
       ↓
GitAnalyzer
  ├─ analyze() → GitStats?
  ├─ [Graceful fallback if not a git repo]
  └─ [Commit, contributor, branch stats]
       ↓
ContextData (saved to .devpilot/local/context.yaml)
```

**ContextData Structure**:
```typescript
interface ContextData {
  scannedAt: string;
  projectRoot: string;
  version: string;
  stats: {
    totalFiles: number;
    totalLines: number;
    codeLines: number;
    languages: Record<string, FileStats>;
  };
  techStack: TechStack;
  dependencies: { runtime: Record<string, string>; dev: Record<string, string> };
  fileStructure: {
    directories: number;
    largestFiles: Array<{ path: string; lines: number; size: number }>;
  };
  git?: GitStats;                              // Optional
  testCoverage?: { runner?: string; percentage?: number; hasConfig: boolean };
  excludePatterns: string[];
}
```

**Key Enhancements**:
- **30+ Language Detection**: Extension map (25+ ext) + filename map (Makefile, Dockerfile, etc.)
- **Separate codeLines Tracking**: Distinguishes actual code from config/docs
- **File-Based Detection**: Handles Makefile, Dockerfile, Jenkinsfile, etc.
- **Git Integration**: Optional git stats collected gracefully
- **Test Coverage Optional**: Detected if test config exists

### Health Check Module

**Purpose**: Analyze code quality across 6 metrics, produce 0-100 health score.

```
ComplexityAnalyzer
  └─ analyze(codeFiles) → { value: number; issues: File[] }
       ↓
DuplicationDetector
  └─ detect(codeFiles) → { percentage: number; issues: File[] }
       ↓
DependencyChecker
  └─ check(rootPath) → { health: number; issues: Dependency[] }
       ↓
TestCoverageDetector
  ├─ detect() → { runner?: string; percentage?: number; hasConfig: boolean }
  └─ [Looks for jest.config, vitest.config, .mocharc, etc.]
       ↓
SecurityAuditor
  └─ audit() → { score: number; vulnerabilities: Vulnerability[] }
       ↓
ScoreCalculator
  ├─ calculateFileSizeScore(largestFiles) → number
  ├─ calculateOverallScore(breakdown, testCoverage, security) → number
  └─ calculateTrend(score, rootPath) → "improving" | "stable" | "declining"
       ↓
HealthScore (saved to .devpilot/local/health.yaml)
```

**Health Score Breakdown (6 Metrics)**:
```typescript
interface HealthScore {
  scannedAt: string;
  overallScore: number;  // 0-100
  breakdown: {
    complexity: number;     // Cyclomatic complexity
    duplication: number;    // Code duplication %
    dependencies: number;   // Dependency health
    fileSize: number;       // File size distribution
  };
  testCoverage: {           // NEW in this update
    runner?: string;        // jest | vitest | mocha
    percentage?: number;    // 0-100
    hasConfig: boolean;
  };
  security: {               // NEW in this update
    score: number;          // 0-100
    vulnerabilities: Array<{ type: string; severity: string; path: string }>;
  };
  trend: "improving" | "stable" | "declining";
}
```

**Scoring Algorithm**:
- **Complexity**: Lower cyclomatic complexity = higher score
- **Duplication**: < 5% duplication = 100; 20%+ = 0
- **Dependencies**: All up-to-date = 100; outdated/unused = lower
- **File Size**: Most files < 300 lines = 100; files > 1000 lines = lower
- **Test Coverage**: >= 80% = 100; < 20% = 0
- **Security**: No vulnerabilities = 100; critical issues = 0

### Memory Module

**Purpose**: Persist and retrieve architectural decisions and coding patterns.

```
MemoryManager
  ├─ addDecision(decision)
  ├─ addPattern(pattern)
  ├─ listDecisions()
  ├─ listPatterns()
  ├─ pruneMemory()  // Remove entries > 30 days old
  └─ calculateTokens()
       ↓
PatternDetector
  ├─ detectPatterns(contextData) → Pattern[]
  └─ [Auto-detect from scan results]
       ↓
.devpilot/shared/memory/
├─ decisions.md
└─ patterns.md
```

**Memory Format** (Markdown):
```markdown
# Decisions

## [2026-03-22] Use Fastify over Express

**Status**: Active
**Impact**: High

Chose Fastify for API server because of better performance and schema validation.

---

# Patterns

## Factory Pattern for Service Creation

Creates services dynamically based on configuration...
```

### Dashboard Module

**Purpose**: Web-based visualization and exploration of project data.

```
StartDashboardAction
  ├─ Initialize Fastify app
  ├─ Serve dashboard HTML at /
  ├─ Register API routes
  │   ├─ GET /api/health
  │   ├─ GET /api/context
  │   ├─ GET /api/memory
  │   └─ GET /api/reviews
  └─ Bind to dynamic port (fallback to 3141)
       ↓
Dashboard UI (HTML/CSS/JS)
  ├─ Health Tab (score, breakdown, trend)
  ├─ Git Tab (commits, contributors, velocity)
  ├─ Coverage Tab (test coverage %)
  ├─ Security Tab (vulnerabilities)
  ├─ Memory Tab (decisions, patterns)
  └─ Reviews Tab (past reviews)
```

**Key Features**:
- **Card-based Layout**: Health, Git, Coverage, Security cards
- **Real-time Data**: Fetches latest from .devpilot/local/
- **Localhost-Only**: 127.0.0.1 binding for security
- **Single File**: No external dependencies; inlined CSS/JS
- **Auto-refresh**: Optional polling for live updates

### Configuration Module

**Purpose**: Manage API keys, model preferences, and scan settings.

```
ConfigManager
  ├─ mergeConfigs(projectPath) → Config
  ├─ loadProjectConfig()
  ├─ loadUserConfig()
  └─ [Merge with CLI defaults]
       ↓
Locations:
  ├─ ~/.devpilot/config.yaml (user-level, 600 perms)
  └─ .devpilot/shared/config.yaml (project-level)
```

**Config Structure**:
```yaml
# User config (~/.devpilot/config.yaml)
apiKeys:
  anthropic: ${ANTHROPIC_API_KEY}
  openai: ${OPENAI_API_KEY}
defaultModel: claude-sonnet-4-5-20250929

# Project config (.devpilot/shared/config.yaml)
projectDefaults:
  scanDepth: 10
  excludePatterns:
    - vendor
    - node_modules
    - .git
```

## Data Flow

### Scan Command Flow

```
user: devpilot scan [--depth D] [--exclude PATTERN] [--full]
                     ↓
         [Check cache if --full not set]
          ↓ (if fresh: use cached context)
          ↓ (else: execute scan)
    ┌─────────────────────────────┐
    │   ScanProjectAction.execute │
    └──────────┬──────────────────┘
               ↓
    ┌─────────────────────────────┐
    │  1. Load configuration      │
    │  2. Walk files              │
    │  3. Apply ignore patterns   │
    │  4. Detect tech stack       │
    │  5. Extract dependencies    │
    │  6. Build context           │
    │  7. Collect git stats       │
    │  8. Auto-detect patterns    │
    │  9. Save context.yaml       │
    └──────────┬──────────────────┘
               ↓
    .devpilot/local/context.yaml
         ↓
    [Cache expires in 15 minutes or with --full]
```

### Health Check Flow

```
user: devpilot health
               ↓
    ┌─────────────────────────────┐
    │ RunHealthCheckAction.execute│
    └──────────┬──────────────────┘
               ↓
    ┌─────────────────────────────┐
    │ Run 5 analyzers in parallel │
    │ 1. Complexity Analysis      │
    │ 2. Duplication Detection    │
    │ 3. Dependency Check         │
    │ 4. Test Coverage Detection  │
    │ 5. Security Audit           │
    └──────────┬──────────────────┘
               ↓
    ┌─────────────────────────────┐
    │ ScoreCalculator             │
    │ • File size score           │
    │ • Overall score (6 metrics) │
    │ • Trend calculation         │
    └──────────┬──────────────────┘
               ↓
    .devpilot/local/health.yaml
```

## Caching Strategy

### Scan Cache

- **Location**: `.devpilot/local/cache/context.yaml`
- **TTL**: 15 minutes
- **Bypass**: `devpilot scan --full`
- **Validation**: Check file modification time

### Health Cache

- **Location**: `.devpilot/local/health.yaml`
- **Strategy**: Always fresh (run all analyzers)
- **Rationale**: Health is critical; recalculated each time

## Error Handling

### Graceful Degradation

| Component | Failure | Handling |
|-----------|---------|----------|
| Git Analyzer | Not a git repo | Skip git stats; continue |
| Test Coverage | Config not found | Set hasConfig=false; skip % |
| Security Audit | Audit tool unavailable | Set score=50; skip vulnerabilities |
| Dashboard | Port unavailable | Try next port (3142, 3143, ...) |
| Memory | Not initialized | Skip pattern detection |
| Config | User config missing | Use defaults; create on first config command |

### Error Recovery

- **Transient Failures**: Retry with exponential backoff
- **Missing Files**: Skip and log warning
- **Permission Errors**: Exit with clear message and chmod suggestion
- **Invalid YAML**: Report line number and syntax error

## Performance Considerations

### Bottlenecks & Optimizations

| Operation | Optimization |
|-----------|--------------|
| File walking | fdir (fast, concurrent) |
| Line counting | Stream-based, single pass |
| Tech detection | Regex match on filenames only |
| Git stats | Spawn child process, timeout after 5s |
| Health analysis | Parallel Promise.all() for 5 analyzers |
| Dashboard startup | Fastify with minimal middleware |

### Target Performance

- **Scan (10k files)**: < 5 seconds
- **Health check**: < 8 seconds
- **Dashboard load**: < 2 seconds
- **Memory operations**: < 500ms

---

**Last Updated**: 2026-03-22
**Architecture Version**: 1.0
