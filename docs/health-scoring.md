# Health Scoring & Code Quality Analysis

## Overview

The Health Check command analyzes project code quality across **6 metrics** and produces a 0-100 overall score. It provides a comprehensive breakdown of complexity, duplication, dependencies, file size, test coverage, and security.

**Command:**
```bash
devpilot health
```

## Health Metrics (6 Total - NEW)

### 1. Complexity Score

Measures cyclomatic complexity of code files.

**What it measures:**
- Decision points in code (if, else, switch, loops, catch)
- Average complexity per file
- Files exceeding complexity thresholds

**Scoring:**
- Complexity 1-3: 100 (optimal)
- Complexity 4-7: 80 (good)
- Complexity 8-15: 60 (acceptable)
- Complexity 16-30: 40 (high)
- Complexity 30+: 0 (critical)

**Implementation:** ComplexityAnalyzer scans AST of TypeScript/JavaScript files.

### 2. Duplication Score

Detects code duplication across files.

**What it measures:**
- Percentage of duplicate code blocks
- Number of duplicated functions/methods
- Duplicated utility functions

**Scoring:**
- 0-5% duplication: 100
- 5-10%: 80
- 10-20%: 60
- 20-30%: 40
- 30%+: 0

**Implementation:** DuplicationDetector uses string similarity matching.

### 3. Dependency Health Score

Analyzes project dependencies.

**What it measures:**
- Outdated packages
- Unused dependencies
- Security vulnerabilities in deps
- Peer dependency conflicts

**Scoring:**
- All up-to-date, no unused: 100
- 1-2 outdated: 80
- 3-5 outdated or unused: 60
- 6-10 issues: 40
- 10+ issues: 0

**Implementation:** DependencyChecker reads package.json and checks npm registry.

### 4. File Size Score

Evaluates code organization by file size.

**What it measures:**
- Distribution of file sizes
- Files exceeding recommended size
- Average file size

**Scoring:**
- Most files < 300 lines: 100
- Some files 300-500 lines: 80
- Multiple files 500-1000 lines: 60
- Large files > 1000 lines: 40
- Very large files > 2000 lines: 0

**Implementation:** ScoreCalculator uses largestFiles from context.

### 5. Test Coverage Score (NEW)

Measures test coverage percentage and configuration.

**What it measures:**
- Test runner presence (Jest, Vitest, Mocha, pytest, etc.)
- Coverage percentage (if available)
- Test configuration existence

**Scoring:**
- Coverage >= 80%: 100
- Coverage 60-79%: 80
- Coverage 40-59%: 60
- Coverage 20-39%: 40
- Coverage < 20% or no tests: 0
- No test config found: 20 (penalty)

**Detected Test Runners:**
- JavaScript: jest, vitest, mocha, ava
- Python: pytest, unittest
- Go: testing (built-in)
- Java: junit, testng

**Implementation:** TestCoverageDetector searches for config files and runs coverage commands.

### 6. Security Score (NEW)

Audits for security vulnerabilities and best practices.

**What it measures:**
- Hardcoded secrets (API keys, passwords)
- Known vulnerable dependencies
- Dangerous practices (eval, exec, etc.)
- Insecure crypto usage
- SQL injection risks

**Severity Levels:**
- Critical: API keys, hardcoded credentials
- High: Known vulns in production deps
- Medium: Dangerous functions, weak crypto
- Low: Best practice violations

**Scoring:**
- No vulnerabilities: 100
- 1-2 low severity: 80
- 3-5 low or 1+ medium: 60
- Multiple medium or 1+ high: 40
- 1+ critical or 5+ high: 0

**Implementation:** SecurityAuditor scans files for patterns and checks npm audit.

## Overall Score Calculation

```typescript
// 6-metric model
const overallScore = (
  (complexity * 0.20) +
  (duplication * 0.15) +
  (dependencies * 0.15) +
  (fileSize * 0.15) +
  (testCoverage * 0.20) +
  (security * 0.15)
);
```

**Weights:**
- **Complexity**: 20% (critical for maintainability)
- **Duplication**: 15% (affects maintainability)
- **Dependencies**: 15% (affects stability)
- **File Size**: 15% (affects readability)
- **Test Coverage**: 20% (critical for reliability)
- **Security**: 15% (critical for safety)

## Health Score Output

```yaml
scannedAt: "2026-03-22T15:45:30Z"
overallScore: 78

breakdown:
  complexity: 82
  duplication: 75
  dependencies: 88
  fileSize: 72

testCoverage:           # NEW
  runner: "jest"
  percentage: 76
  hasConfig: true

security:              # NEW
  score: 85
  vulnerabilities:
    - type: "hardcoded-secret"
      severity: "high"
      path: "src/config.ts:42"
    - type: "vulnerable-dependency"
      severity: "medium"
      path: "package.json (lodash@4.17.0)"

trend: "improving"     # Compared to previous scan
```

## Trend Calculation

Compares current health score to previous scan stored in `.devpilot/local/health.yaml`.

**Trend Values:**
- **improving**: Score increased by 5+ points
- **stable**: Score changed by -4 to +4 points
- **declining**: Score decreased by 5+ points

## Health Check Workflow

```
devpilot health
    ↓
[Load previous health score if exists]
    ↓
[Run 5 analyzers in parallel]
├─ ComplexityAnalyzer.analyze(codeFiles)
├─ DuplicationDetector.detect(codeFiles)
├─ DependencyChecker.check(rootPath)
├─ TestCoverageDetector.detect()
└─ SecurityAuditor.audit()
    ↓
[Calculate scores and trend]
    ↓
[Save to .devpilot/local/health.yaml]
    ↓
[Display to user]
```

**Performance:** Parallelized; typical runtime 6-8 seconds for 500-file project.

## Test Coverage Detection

### Jest

**Configuration files:**
- jest.config.js
- jest.config.ts
- jest.config.json
- package.json (jest field)

**Coverage extraction:**
```bash
npm test -- --coverage --json > coverage.json
# Parses coverage percentage from output
```

### Vitest

**Configuration files:**
- vitest.config.ts
- vitest.config.js
- vite.config.ts (vitest field)

**Coverage extraction:**
```bash
npm test -- --coverage
```

### Mocha

**Configuration files:**
- .mocharc.js
- .mocharc.json
- .mocharc.yaml

**Coverage extraction:**
```bash
npm test -- --reporter json
# Requires nyc or c8 integration
```

### pytest (Python)

**Configuration files:**
- pytest.ini
- setup.cfg
- pyproject.toml
- tox.ini

**Coverage extraction:**
```bash
pytest --cov --cov-report=json
```

## Security Audit Details

### Checks Performed

| Check | Severity | Pattern |
|-------|----------|---------|
| Hardcoded API keys | Critical | `ANTHROPIC_API_KEY=sk-...` |
| Hardcoded passwords | Critical | `password: "abc123"` |
| Hardcoded secrets | High | `SECRET_TOKEN=...` |
| Eval usage | High | `eval(userInput)` |
| Exec usage | High | `exec(command)` |
| Weak crypto | Medium | `crypto.createCipher()` |
| SQL injection risk | Medium | `` `SELECT * FROM users WHERE id=${id}` `` |
| Known vulns | High/Medium | npm audit findings |
| Unsafe regex | Medium | ReDoS patterns |
| Node child_process | Medium | `child_process.spawn()` with user input |

### Example Output

```yaml
security:
  score: 72
  vulnerabilities:
    - type: "hardcoded-secret"
      severity: "critical"
      path: "src/config.ts:15"

    - type: "known-vulnerability"
      severity: "high"
      path: "dependencies: lodash@4.17.0 (CVE-2021-23337)"

    - type: "eval-usage"
      severity: "high"
      path: "src/utils/evaluator.ts:42"

    - type: "weak-crypto"
      severity: "medium"
      path: "src/auth/hash.ts:18"
```

## Interpreting Scores

### Score Ranges

| Range | Assessment | Action |
|-------|------------|--------|
| 90-100 | Excellent | Maintain current practices |
| 75-89 | Good | Address 1-2 low priority items |
| 60-74 | Fair | Plan improvements in next sprint |
| 45-59 | Poor | Prioritize health improvements |
| 0-44 | Critical | Emergency action required |

### Common Issues by Score

**High Complexity (< 70):**
- Break large functions into smaller, testable units
- Use design patterns (Factory, Strategy, etc.)
- Extract common logic into utilities

**High Duplication (< 70):**
- Extract shared code to common modules
- Use composition over copy-paste
- Create reusable utility functions

**Poor Dependencies (< 70):**
- Run `npm audit` and update vulnerable packages
- Remove unused dependencies
- Pin versions to prevent surprises

**Large Files (< 70):**
- Split files > 500 lines into separate modules
- Extract classes/components into separate files
- Use barrel exports for organization

**Low Coverage (< 70):**
- Add unit tests for critical paths
- Test error scenarios and edge cases
- Use code coverage tools to identify gaps

**Security Issues (< 70):**
- Rotate API keys and credentials
- Use environment variables for secrets
- Run `npm audit fix` for known vulnerabilities
- Code review for eval/exec usage

## Health Check Integration with Dashboard

Dashboard displays:
1. **Health Card**: Overall score with trend indicator
2. **Breakdown Cards**: Individual metric scores
3. **Test Coverage Card**: Runner, percentage, trend
4. **Security Card**: Score, top vulnerabilities
5. **History Chart**: Score over past 30 days

## Performance Optimization

### Parallelization

All 5 analyzers run in parallel via `Promise.all()`:
```typescript
const [complexity, duplication, dependencies, testCoverage, security] =
  await Promise.all([
    new ComplexityAnalyzer().analyze(codeFiles),
    new DuplicationDetector().detect(codeFiles),
    new DependencyChecker().check(rootPath),
    new TestCoverageDetector(rootPath).detect(),
    new SecurityAuditor(rootPath).audit(),
  ]);
```

### Benchmarks

| Analyzer | Time | Notes |
|----------|------|-------|
| Complexity | 2-3s | AST parsing |
| Duplication | 1-2s | String matching |
| Dependencies | 1-2s | npm registry check |
| Test Coverage | 1s | Config file scan |
| Security | 2-3s | Pattern matching + npm audit |
| **Total** | **~6-8s** | Parallel execution |

## Examples

### Example: Good Health (Score 85)

```yaml
overallScore: 85

breakdown:
  complexity: 82      # Most functions < 10 complexity
  duplication: 88     # < 3% duplication
  dependencies: 90    # All up-to-date
  fileSize: 80        # Most files < 400 lines

testCoverage:
  runner: "vitest"
  percentage: 82      # Good coverage
  hasConfig: true

security:
  score: 85           # No critical issues
  vulnerabilities: [] # Clean

trend: "improving"
```

**Interpretation:** Healthy codebase. Maintain current practices.

### Example: Fair Health (Score 68)

```yaml
overallScore: 68

breakdown:
  complexity: 72      # Some complex functions
  duplication: 62     # ~8% duplication
  dependencies: 75    # 2-3 outdated packages
  fileSize: 65        # Some large files (600-800 LOC)

testCoverage:
  runner: "jest"
  percentage: 65      # Needs improvement
  hasConfig: true

security:
  score: 70           # 1 medium severity issue
  vulnerabilities:
    - type: "eval-usage"
      severity: "medium"
      path: "src/eval.ts:42"

trend: "stable"
```

**Interpretation:** Room for improvement. Plan refactoring and add tests.

### Example: Critical Health (Score 42)

```yaml
overallScore: 42

breakdown:
  complexity: 45      # Many functions > 20 complexity
  duplication: 38     # ~25% duplication
  dependencies: 35    # Multiple vulnerabilities
  fileSize: 50        # Many large files > 1000 LOC

testCoverage:
  runner: null
  percentage: null    # No tests
  hasConfig: false

security:
  score: 30           # 2+ high/critical issues
  vulnerabilities:
    - type: "hardcoded-secret"
      severity: "critical"
      path: "src/config.ts:15"
    - type: "known-vulnerability"
      severity: "high"
      path: "dependencies: lodash (CVE-2021-23337)"

trend: "declining"
```

**Interpretation:** Critical issues. Immediate action required.

---

**Last Updated**: 2026-03-22
**Version**: 1.0
**Related**: scanner-and-context.md, system-architecture.md
