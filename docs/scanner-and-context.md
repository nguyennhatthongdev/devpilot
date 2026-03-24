# Scanner & Context Data

## Overview

The Scanner module is responsible for traversing a project's codebase, extracting metadata, detecting the technology stack, and building a comprehensive `ContextData` object. It detects **30+ programming languages** using both file extensions and filename-based detection.

## Key Components

### FileWalker

Recursively walks the file system and collects file metadata.

**Methods:**
```typescript
walk(rootPath: string, maxDepth: number): Promise<string[]>
  // Returns absolute paths of all files up to maxDepth
  // Uses fdir for fast, concurrent traversal

countLines(filePath: string): Promise<number>
  // Streams file and counts non-empty lines

getFileSize(filePath: string): Promise<number>
  // Returns file size in bytes
```

**Implementation Notes:**
- Uses streams for large files to avoid memory overhead
- Respects .gitignore by default (applied by IgnoreFilter)
- Skips symlinks and binary files

### IgnoreFilter

Filters files based on `.gitignore`, `.devpilotignore`, and custom patterns.

**Methods:**
```typescript
loadIgnoreFile(rootPath: string, filename: string): Promise<void>
  // Load patterns from .gitignore or .devpilotignore

addPatterns(patterns: string[]): void
  // Add programmatic exclude patterns

filter(files: string[], rootPath: string): string[]
  // Return only non-ignored files
```

**Precedence:**
1. .gitignore (loaded first)
2. .devpilotignore (overrides .gitignore)
3. CLI --exclude flag
4. Project config excludePatterns

### TechDetector

Identifies the technology stack: frameworks, language, package manager, Node version.

**Methods:**
```typescript
detect(rootPath: string, files: string[]): Promise<TechStack>
  // Returns TechStack object

extractDependencies(rootPath: string): Promise<{
  runtime: Record<string, string>;
  dev: Record<string, string>;
}>
  // Extracts from package.json
```

**Detection Rules:**

| Detection | Method | Example |
|-----------|--------|---------|
| Framework | Config file presence | next.config.js → "next.js" |
| Language | File extension or tsconfig | .ts files + tsconfig.json → "typescript" |
| Package Manager | Lock file | yarn.lock → "yarn" |
| Node Version | package.json engines.node | ">=18.0.0" |
| Framework (npm) | package.json deps | react dependency → "react" |

**Detected Frameworks:**
- next.js, nuxt.js, vite, angular, svelte, remix, astro (from configs)
- react, vue, express, fastify (from package.json dependencies)

### ContextBuilder

Aggregates scan data into a `ContextData` object. Handles **30+ language detection** with both extension-based and filename-based detection.

**Methods:**
```typescript
build(
  files: string[],
  rootPath: string,
  techStack: TechStack,
  dependencies: Dependencies,
  excludePatterns: string[],
): Promise<ContextData>
```

#### Language Detection (30+)

**Extension Map (25+ languages):**
```typescript
ts, tsx, js, jsx, mjs, cjs              // JavaScript/TypeScript
py, pyw                                 // Python
java, kt, scala                         // JVM languages
go, rs, rb, php, swift, cs              // Systems/Backend languages
c, h, cpp, cc, cxx, hpp                 // C/C++
sh, bash, zsh                           // Shell scripts
sql, r, R                               // Data languages
lua, pl, pm                             // Scripting languages
dart, groovy                            // Mobile/JVM
ex, exs, clj, cljs                      // Functional languages
hs, ml, mli                             // Haskell, OCaml
md, json, yaml, yml, css, scss, html    // Config/Markup
```

**Filename Map (extensionless files - NEW):**
```typescript
Makefile → "make"
Dockerfile → "docker"
Dockerfile.* → "docker"
Jenkinsfile → "groovy"
Vagrantfile → "ruby"
Rakefile → "ruby"
Gemfile → "ruby"
```

**Code Extensions (separate tracking - NEW):**
Distinguishes code lines from config/documentation:
- Code: ts, tsx, js, jsx, py, java, go, rs, rb, php, swift, cs, c, cpp, sh, sql, etc.
- Non-code: json, yaml, md, html (counted but tracked separately)

#### Stats Calculation

```typescript
stats: {
  totalFiles: number;        // All files including lock files
  totalLines: number;        // All lines in all files
  codeLines: number;         // Lines in CODE_EXTENSIONS only (NEW)
  languages: {               // Per-language breakdown
    [lang]: { files: number; lines: number }
  }
}
```

**Lock Files Excluded from LOC Counting:**
- package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb
- Gemfile.lock, Cargo.lock, composer.lock, poetry.lock

These files are counted as totalFiles but excluded from lines and codeLines.

### GitAnalyzer (NEW)

Collects git statistics from the repository.

**Methods:**
```typescript
analyze(): Promise<GitStats | undefined>
  // Returns GitStats or undefined if not a git repo
```

**Implementation:**
- Spawns `git` commands: rev-list, rev-parse, shortlog, branch
- 5-second timeout per command
- Gracefully returns undefined on error (not a git repo, git not installed, etc.)

**Collected Data:**
```typescript
interface GitStats {
  commits: number;              // Total commits
  contributors: number;        // Unique authors
  branches: number;            // Total branches
  currentBranch: string;       // Current HEAD
  firstCommit: string;         // ISO date of oldest commit
  lastCommit: string;          // ISO date of newest commit
  commitsPerWeek: number;      // Average velocity
}
```

## ContextData Structure (NEW FIELDS)

```typescript
interface ContextData {
  scannedAt: string;
  projectRoot: string;
  version: string;              // Scanner version (1.0)

  stats: {
    totalFiles: number;
    totalLines: number;
    codeLines: number;           // NEW: Code-only lines
    languages: Record<string, FileStats>;
  };

  techStack: TechStack;
  dependencies: { runtime: Record<string, string>; dev: Record<string, string> };

  fileStructure: {
    directories: number;
    largestFiles: Array<{ path: string; lines: number; size: number }>;
  };

  git?: GitStats;                // NEW: Optional git stats
  testCoverage?: {               // NEW: Optional test coverage config
    runner?: string;             // jest | vitest | mocha | undefined
    percentage?: number;         // 0-100 or undefined
    hasConfig: boolean;          // True if test config exists
  };

  excludePatterns: string[];
}
```

## Scan Command

### Usage

```bash
# Default scan with 15-minute cache
devpilot scan

# Force fresh scan (bypass cache)
devpilot scan --full

# Limit directory depth
devpilot scan --depth 5

# Exclude patterns
devpilot scan --exclude "vendor" --exclude ".git"

# Combine options
devpilot scan --full --depth 8 --exclude "node_modules"
```

### Caching

- **Cache location**: `.devpilot/local/cache/context.yaml`
- **TTL**: 15 minutes (checked on every scan)
- **Bypass**: Use `--full` flag
- **Check**: Compares file modification time; if < 15 minutes old, returns cached context

### Output

```
✓ Scan complete in 2.3s
  • 1,234 files
  • 45,678 lines of code
  • Detected: TypeScript, React, Next.js, Node 18.0.0
  • 3 detected patterns saved to memory
```

### Error Handling

| Scenario | Behavior |
|----------|----------|
| .gitignore missing | Scan continues without ignores |
| Empty project | Returns context with 0 files |
| Permission denied | Shows error and exits |
| Cache corrupted | Deletes cache; re-scans |

## Integration with Health Check

The `context.yaml` from scan is used by health check to:
1. **File Size Score**: Analyzes largestFiles
2. **Language Stats**: Provides breakdown by language
3. **Tech Stack**: Influences health recommendations
4. **Git Stats**: Calculated into commit velocity metrics

## Auto-Pattern Detection

After scan, PatternDetector auto-detects patterns from ContextData:

**Detected Patterns:**
- Framework usage (React + Next.js → "React SSR")
- Monorepo patterns (packages/ directory)
- API patterns (express/fastify detected)
- Database patterns (prisma, mongoose detected)
- Testing patterns (test files found)

These are automatically added to `.devpilot/shared/memory/patterns.md` unless memory is not initialized.

## Performance

### Benchmarks (on DevPilot itself)

| Operation | Time | Files Scanned |
|-----------|------|---------------|
| Walk 500 files | 0.2s | 500 |
| Count lines | 0.8s | 500 |
| Tech detection | 0.1s | 500 |
| Git stats | 0.5s | (git data) |
| **Total scan** | **~2s** | **500** |

Scales roughly linearly: 10k files ≈ 4-5s

### Optimization Tips

- Use `--depth N` to limit traversal for large projects
- Add patterns to `.devpilotignore` for vendor/node_modules
- Run `--full` scan in background (CI pipeline)
- Cache benefits most from hourly/daily scans

## Examples

### Node.js Project

```yaml
scannedAt: "2026-03-22T15:30:45Z"
projectRoot: /home/user/myapp
version: "1.0"

stats:
  totalFiles: 245
  totalLines: 12450
  codeLines: 9800          # Excludes config/docs
  languages:
    typescript: { files: 145, lines: 8900 }
    javascript: { files: 32, lines: 1200 }
    json: { files: 18, lines: 450 }
    markdown: { files: 20, lines: 800 }
    scss: { files: 15, lines: 950 }
    other: { files: 15, lines: 150 }

techStack:
  frameworks: ["react", "next.js", "fastify"]
  language: "typescript"
  packageManager: "npm"
  nodeVersion: ">=18.0.0"

dependencies:
  runtime:
    next: "^14.0.0"
    react: "^18.2.0"
  dev:
    typescript: "^5.0.0"
    vitest: "^0.34.0"

fileStructure:
  directories: 42
  largestFiles:
    - path: src/pages/index.tsx
      lines: 487
      size: 12420
    - path: src/lib/api.ts
      lines: 312
      size: 8956

git:
  commits: 287
  contributors: 5
  branches: 12
  currentBranch: "main"
  firstCommit: "2025-06-15T10:00:00Z"
  lastCommit: "2026-03-22T14:30:00Z"
  commitsPerWeek: 8.5

testCoverage:
  runner: "jest"
  percentage: 76
  hasConfig: true

excludePatterns:
  - node_modules
  - .git
  - dist
```

### Python/Multi-Language Project

```yaml
stats:
  totalFiles: 512
  totalLines: 28945
  codeLines: 21234
  languages:
    python: { files: 287, lines: 15600 }
    javascript: { files: 145, lines: 4200 }
    docker: { files: 8, lines: 342 }
    makefile: { files: 1, lines: 45 }
    yaml: { files: 34, lines: 2100 }
    markdown: { files: 37, lines: 5960 }

techStack:
  frameworks: ["fastapi", "celery"]
  language: "python"
  packageManager: "pip"
  nodeVersion: null  # Not a Node project

git:
  commits: 1245
  contributors: 12
  branches: 34
  currentBranch: "develop"
  commitsPerWeek: 15.2

testCoverage:
  runner: "pytest"
  percentage: 82
  hasConfig: true
```

---

**Last Updated**: 2026-03-22
**Version**: 1.0
**Related**: system-architecture.md, health-scoring.md
