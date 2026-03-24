# DevPilot Code Standards & Codebase Structure

## Directory Structure

```
devpilot/
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts               # CLI entry point
│   │   │   ├── actions/               # Action handlers
│   │   │   │   ├── types.ts           # ActionResult interface
│   │   │   │   ├── scan-project.ts
│   │   │   │   ├── run-health-check.ts
│   │   │   │   ├── review-code.ts
│   │   │   │   ├── start-dashboard.ts
│   │   │   │   └── manage-memory.ts
│   │   │   ├── commands/              # CLI command definitions
│   │   │   │   ├── scan.ts
│   │   │   │   ├── health.ts
│   │   │   │   ├── review.ts
│   │   │   │   ├── memory.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── dashboard.ts
│   │   │   ├── lib/
│   │   │   │   ├── scanner/
│   │   │   │   │   ├── types.ts       # ContextData, FileStats, TechStack
│   │   │   │   │   ├── file-walker.ts
│   │   │   │   │   ├── ignore-filter.ts
│   │   │   │   │   ├── tech-detector.ts
│   │   │   │   │   ├── context-builder.ts
│   │   │   │   │   └── git-analyzer.ts
│   │   │   │   ├── health/
│   │   │   │   │   ├── types.ts       # HealthScore interface
│   │   │   │   │   ├── complexity-analyzer.ts
│   │   │   │   │   ├── duplication-detector.ts
│   │   │   │   │   ├── dependency-checker.ts
│   │   │   │   │   ├── test-coverage-detector.ts
│   │   │   │   │   ├── security-auditor.ts
│   │   │   │   │   └── score-calculator.ts
│   │   │   │   ├── memory/
│   │   │   │   │   ├── types.ts       # Decision, Pattern interfaces
│   │   │   │   │   ├── memory-manager.ts
│   │   │   │   │   └── pattern-detector.ts
│   │   │   │   ├── server/
│   │   │   │   │   ├── api-routes.ts
│   │   │   │   │   ├── dashboard-html.ts
│   │   │   │   │   └── port-finder.ts
│   │   │   │   ├── llm/
│   │   │   │   │   ├── types.ts       # LLMProvider, ReviewResult
│   │   │   │   │   ├── provider-manager.ts
│   │   │   │   │   └── prompt-templates.ts
│   │   │   │   ├── config-manager.ts
│   │   │   │   └── file-utils.ts
│   │   │   └── utils/                 # Shared utilities
│   │   │       ├── logger.ts
│   │   │       └── validators.ts
│   │   ├── tests/
│   │   │   ├── scanner.test.ts
│   │   │   ├── health.test.ts
│   │   │   ├── memory.test.ts
│   │   │   ├── provider-manager.test.ts
│   │   │   └── integration.test.ts
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── dist/                      # Built output (gitignored)
│   └── web/
│       └── (placeholder)
├── .devpilot/                         # Per-project data (created by init)
│   ├── shared/
│   │   ├── config.yaml
│   │   └── memory/
│   │       ├── decisions.md
│   │       └── patterns.md
│   └── local/
│       ├── context.yaml
│       ├── health.yaml
│       ├── cache/
│       └── reviews/
├── .gitignore
├── README.md
├── package.json
└── package-lock.json
```

## Naming Conventions

### Files & Directories
- **kebab-case** for all source files (`.ts`, `.js`)
- **UpperPascalCase** for classes: `FileWalker`, `TechDetector`, `ContextBuilder`
- **camelCase** for functions, variables, and properties
- **UPPER_SNAKE_CASE** for constants
- **descriptive names**: `complexity-analyzer.ts` (not `ca.ts`), `provider-manager.ts`

### Type Definitions
- **Interfaces**: `ContextData`, `HealthScore`, `FileStats`, `GitStats`, `TechStack`
- **Types**: `ActionResult<T>`, `ScanOptions`, `HealthBreakdown`
- **Enums**: Use PascalCase for both enum name and members (e.g., `Status.Active`)

### Functions & Methods
- **Action handlers**: `async execute(rootPath: string, options?: T): Promise<ActionResult<R>>`
- **Utility functions**: `async detectLanguage(filePath: string): Promise<string>`
- **Validators**: `isValidPath(path: string): boolean`
- **Analyzers**: `analyze(files: string[]): Promise<AnalysisResult>`

## Type System

### Core Interfaces

#### ContextData
```typescript
interface ContextData {
  scannedAt: string;                // ISO string
  projectRoot: string;              // Absolute path
  version: string;                  // Scanner version
  stats: {
    totalFiles: number;
    totalLines: number;
    codeLines: number;              // Code-specific lines (NEW)
    languages: Record<string, FileStats>;
  };
  techStack: TechStack;
  dependencies: {
    runtime: Record<string, string>;
    dev: Record<string, string>;
  };
  fileStructure: {
    directories: number;
    largestFiles: Array<{ path: string; lines: number; size: number }>;
  };
  git?: GitStats;                   // Optional (NEW)
  testCoverage?: {                  // Optional (NEW)
    runner?: string;
    percentage?: number;
    hasConfig: boolean;
  };
  excludePatterns: string[];
}
```

#### HealthScore
```typescript
interface HealthScore {
  scannedAt: string;
  overallScore: number;             // 0-100
  breakdown: {
    complexity: number;
    duplication: number;
    dependencies: number;
    fileSize: number;
  };
  testCoverage: {                   // New in this update
    runner?: string;                // jest | vitest | mocha | undefined
    percentage?: number;            // 0-100 or undefined
    hasConfig: boolean;
  };
  security: {                       // New in this update
    score: number;                  // 0-100
    vulnerabilities: Array<{
      type: string;
      severity: string;             // critical | high | medium | low
      path: string;
    }>;
  };
  trend: "improving" | "stable" | "declining";
}
```

#### TechStack
```typescript
interface TechStack {
  frameworks: string[];             // [react, express, fastify, etc.]
  language: string;                 // javascript | typescript | python | etc.
  packageManager?: string;          // npm | yarn | pnpm | bun
  nodeVersion?: string;             // e.g., ">=18.0.0"
}
```

#### GitStats (NEW)
```typescript
interface GitStats {
  commits: number;
  contributors: number;
  branches: number;
  currentBranch: string;
  firstCommit: string;              // ISO date
  lastCommit: string;               // ISO date
  commitsPerWeek: number;
}
```

#### ActionResult<T>
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Error Handling

### Pattern
```typescript
try {
  // Operation
} catch (error) {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Operation failed',
  };
}
```

### Logging
```typescript
// Use console for user-facing messages
console.log(chalk.green('✓ Scan complete'));
console.warn(chalk.yellow('⚠ Missing dependency'));
console.error(chalk.red('✗ Error: ' + message));
```

### Graceful Degradation
- **Missing git repo**: Skip git stats; continue with scan
- **Test config not found**: Set hasConfig=false; continue
- **File read error**: Skip file and log warning; continue
- **LLM API error**: Return error result; let user handle retry

## Code Style Guidelines

### TypeScript
- **Strict mode**: All files must pass `tsconfig.json` strict checks
- **No `any` types**: Use generics or `unknown` with type guards
- **Async/await**: Preferred over `.then()` for readability
- **Error messages**: Include context (file path, operation name, values)
- **Comments**: Only for "why", not "what"; code should be self-documenting

### Naming in Code
```typescript
// Good: Clear intent
const codeLines = lines.filter(line => /\S/.test(line)).length;
const largestFiles = files.sort((a, b) => b.lines - a.lines).slice(0, 10);

// Avoid: Ambiguous abbreviations
const cl = lines.length;             // ❌ Unclear
const lf = files.slice(0, 10);       // ❌ Unclear
```

### File Size Limits
- **Target**: < 200 lines per file for optimal context management
- **Splitting**: Extract functions into separate modules at 250+ lines
- **Exceptions**: Test files and type definitions can exceed this

### Imports
```typescript
// Order: Node → External → Internal → Types
import { join, dirname } from 'path';
import { readFile, writeFile } from 'fs/promises';

import YAML from 'yaml';
import chalk from 'chalk';

import { FileWalker } from './file-walker.js';
import { ConfigManager } from '../config-manager.js';

import type { ContextData } from './types.js';
```

## Testing Standards

### Test Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ContextBuilder', () => {
  let builder: ContextBuilder;

  beforeEach(() => {
    builder = new ContextBuilder();
  });

  it('should detect typescript from tsconfig.json', async () => {
    const files = ['/project/tsconfig.json', '/project/src/index.ts'];
    const context = await builder.build(files, '/project', techStack, deps, []);
    expect(context.techStack.language).toBe('typescript');
  });

  it('should handle missing files gracefully', async () => {
    const context = await builder.build([], '/project', techStack, deps, []);
    expect(context.stats.totalFiles).toBe(0);
  });
});
```

### Coverage Goals
- **Target**: 80%+ statement coverage
- **Critical paths**: 100% (scanner, health calculation, memory)
- **Edge cases**: Test graceful degradation for missing features

## Configuration Management

### Config Hierarchy (lowest to highest priority)
1. **CLI defaults** (hardcoded in code)
2. **User config** (`~/.devpilot/config.yaml`)
3. **Project config** (`.devpilot/shared/config.yaml`)
4. **CLI flags** (command-line arguments)

### User Config Location
```bash
~/.devpilot/config.yaml
# Permissions: 600 (owner-only read/write)
```

### Project Config Location
```bash
.devpilot/shared/config.yaml
# Git-tracked; contains project-specific settings
```

## Performance Guidelines

### Optimization Priorities
1. **User feedback**: Show progress for long operations
2. **Caching**: Scan cache = 15 minutes; health always fresh
3. **Parallelization**: Use Promise.all() for independent operations
4. **Stream processing**: Count lines via streams, not full file reads

### Benchmarks
| Operation | Target | Implementation |
|-----------|--------|-----------------|
| Scan 10k files | < 5s | fdir + parallel processing |
| Health check | < 8s | Promise.all(5 analyzers) |
| Dashboard load | < 2s | Inlined HTML/CSS |
| Memory list | < 500ms | Direct file read |

## Security Guidelines

### API Keys
- **Storage**: `~/.devpilot/config.yaml` with 600 permissions
- **Loading**: Via ConfigManager; never log keys
- **Env vars**: Support ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.
- **Validation**: Test key before saving with provider.testKey()

### Dashboard
- **Binding**: Localhost (127.0.0.1) only
- **No auth**: Assumes local development environment
- **Data**: Read-only access to .devpilot/local/ files

### File Handling
- **Path validation**: Ensure targets are within project directory
- **Size limits**: Skip files > 10 MB during scanning
- **Permissions**: Respect .gitignore and .devpilotignore

## Documentation Standards

### Comments
```typescript
// Use sparingly; code should be self-documenting
// Explain "why" not "what"

// Gracefully handle missing git repo (don't fail scan)
const gitAnalyzer = new GitAnalyzer(rootPath);
contextData.git = await gitAnalyzer.analyze();
```

### Function Documentation
```typescript
/**
 * Build context data from scanned files.
 * Detects 30+ languages by extension and filename.
 *
 * @param files - Absolute file paths
 * @param rootPath - Project root directory
 * @param techStack - Detected tech stack
 * @param dependencies - Runtime and dev dependencies
 * @param excludePatterns - Patterns to exclude from analysis
 * @returns ContextData with stats, tech stack, and file structure
 */
async build(
  files: string[],
  rootPath: string,
  techStack: TechStack,
  dependencies: Dependencies,
  excludePatterns: string[],
): Promise<ContextData>
```

## CLI Standards

### Command Structure
```typescript
// All commands follow this pattern
program
  .command('scan')
  .option('--depth <n>', 'Max directory depth', '10')
  .option('--exclude <pattern...>', 'Exclude patterns')
  .option('--full', 'Bypass cache')
  .action(async (options) => {
    const result = await new ScanProjectAction().execute(
      process.cwd(),
      options,
    );
    if (result.success) {
      console.log(chalk.green('✓ Scan complete'));
    } else {
      console.error(chalk.red('✗ ' + result.error));
      process.exit(1);
    }
  });
```

### Output Format
- **Success**: Green checkmark + message
- **Warning**: Yellow warning icon + message
- **Error**: Red X + message + exit code 1
- **JSON**: Only if explicitly requested with `--json` flag

## Dependencies

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| commander | ^11.0 | CLI argument parsing |
| chalk | ^5.0 | Colored terminal output |
| yaml | ^2.0 | YAML parsing/stringification |
| fastify | ^4.0 | Dashboard server |
| @ai-sdk/anthropic | ^0.0 | Claude models |
| @ai-sdk/openai | ^0.0 | GPT models |
| @ai-sdk/google | ^0.0 | Gemini models |
| fdir | ^6.0 | Fast file discovery |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.0 | Type checking |
| vitest | ^0.34 | Unit testing |
| tsup | ^7.0 | Build tool |

### No Breaking Changes
- Keep Node.js >= 18 requirement
- Maintain CLI command compatibility
- Don't change ContextData or HealthScore structure without versioning

## Git Workflow

### Commit Messages
Use conventional commits:
```
type(scope): subject

body (optional)
footer (optional)

Examples:
- feat(scanner): add 30+ language detection
- fix(health): correct score calculation for security
- docs: update API documentation
- refactor: simplify complexity analyzer
- test: add coverage detection tests
```

### Branch Naming
- Feature: `feature/scanner-improvements`
- Bug fix: `fix/health-score-calculation`
- Docs: `docs/architecture`

### Pull Requests
- Link to related issues
- Include test coverage metrics
- Run `npm test` before submitting
- Update docs if behavior changes

---

**Last Updated**: 2026-03-22
**Version**: 1.0
**Owner**: DevPilot Team
