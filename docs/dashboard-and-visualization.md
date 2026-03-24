# Dashboard & Visualization Guide

## Overview

The DevPilot Dashboard is a web-based interface providing real-time visualization of project health, git statistics, test coverage, security metrics, and memory (decisions & patterns).

**Access:** Open `http://localhost:3141` after running `devpilot dashboard`

**Features:**
- Real-time health scoring with trend indicators
- Git statistics (commits, contributors, velocity)
- Test coverage metrics and runner detection
- Security vulnerabilities and scores
- Memory browser (decisions and patterns)
- Code review history
- Localhost-only access for security

## Starting the Dashboard

```bash
devpilot dashboard
```

**Output:**
```
✓ Dashboard running at http://localhost:3141
  Press Ctrl+C to stop
```

## Dashboard Tabs

### Health Tab

Displays overall project health score and breakdown.

**Components:**

1. **Overall Score Card**
   - Large 0-100 score
   - Color-coded: Green (90+), Yellow (60-89), Red (0-59)
   - Trend indicator: ↑ (improving), → (stable), ↓ (declining)
   - Last scanned timestamp

2. **Metrics Breakdown (6 metrics)**
   - Complexity Score: 0-100
   - Duplication: 0-100
   - Dependencies: 0-100
   - File Size: 0-100
   - **Test Coverage (NEW)**: Runner + %
   - **Security (NEW)**: Score + vulnerability count

3. **Detailed Issue List**
   - Top issues by metric
   - Severity indicators
   - File paths for navigation
   - Recommended actions

**Example Display:**
```
Overall Health: 78  ↑ improving

Breakdown
├─ Complexity: 82 (Good)
├─ Duplication: 75 (Good)
├─ Dependencies: 88 (Excellent)
├─ File Size: 72 (Fair)
├─ Test Coverage: jest @ 76% (Good)
└─ Security: 85 (Excellent) - No critical issues

Issues
1. [complexity] src/pages/dashboard.tsx has complexity 23
2. [file-size] src/lib/api.ts (487 lines)
3. [duplication] Similar code in src/utils/* (8%)
```

### Git Tab (NEW)

Displays git statistics for the repository.

**Components:**

1. **Stats Card**
   - Total commits
   - Unique contributors
   - Total branches
   - Current branch
   - Commits per week (velocity)

2. **Timeline**
   - First commit date
   - Last commit date
   - Repository age

3. **Activity Graph**
   - Commits per week trend
   - Contributor distribution
   - Branch activity

**Example Display:**
```
Git Statistics

Stats
├─ Commits: 287
├─ Contributors: 5
├─ Branches: 12
├─ Current: main
└─ Velocity: 8.5 commits/week

Timeline
├─ First commit: 2025-06-15
├─ Last commit: 2026-03-22
└─ Age: 39 weeks

Top Contributors
1. Alice (145 commits)
2. Bob (87 commits)
3. Charlie (35 commits)
```

### Coverage Tab (NEW)

Shows test coverage metrics and configuration.

**Components:**

1. **Coverage Summary Card**
   - Test runner type (jest, vitest, mocha, pytest, etc.)
   - Coverage percentage (0-100)
   - Trend indicator
   - Last updated timestamp

2. **Coverage Breakdown**
   - Lines coverage %
   - Branches coverage %
   - Functions coverage %
   - Statements coverage %

3. **Recommendations**
   - Target 80%+ coverage
   - Untested files/functions
   - Critical path coverage status

**Example Display:**
```
Test Coverage

Runner: jest
Coverage: 76%  ↑ improving (was 72% 7 days ago)

Breakdown
├─ Lines: 76%
├─ Branches: 71%
├─ Functions: 78%
└─ Statements: 76%

Recommendations
• Target: 80% coverage
• Add tests for: src/lib/parser.ts, src/utils/format.ts
• Critical path coverage: 92% (Good)
```

### Security Tab (NEW)

Displays security audit results and vulnerabilities.

**Components:**

1. **Security Score Card**
   - 0-100 score
   - Vulnerability count by severity
   - Last audit timestamp
   - Trend (improving/stable/declining)

2. **Vulnerabilities by Severity**
   - Critical (red): Hardcoded secrets, critical CVEs
   - High (orange): Dangerous functions, high CVEs
   - Medium (yellow): Weak practices, medium CVEs
   - Low (blue): Best practice violations

3. **Details View**
   - Vulnerability type
   - Severity level
   - File path and line number
   - Remediation guidance

**Example Display:**
```
Security Audit

Score: 85  → stable

Vulnerabilities
├─ Critical: 0
├─ High: 1
├─ Medium: 2
└─ Low: 3

Issues
1. [HIGH] Hardcoded secret in src/config.ts:42
   Fix: Move to environment variable

2. [MEDIUM] Weak crypto in src/auth/hash.ts:18
   Fix: Use bcrypt instead of createCipher()

3. [MEDIUM] Vulnerable dep: lodash@4.17.0 (CVE-2021-23337)
   Fix: npm update lodash

4. [LOW] Eval usage in src/eval.ts:15
   Fix: Consider safer alternatives
```

### Memory Tab

Browse architectural decisions and coding patterns.

**Components:**

1. **Decisions List**
   - Date decided
   - Title
   - Status (Active, Archived, Superseded)
   - Impact (High, Medium, Low)
   - Brief summary

2. **Patterns List**
   - Pattern name
   - Category (api, database, authentication, etc.)
   - Description
   - Example files
   - Usage count

3. **Search & Filter**
   - Full-text search
   - Filter by status, date, impact
   - Sort by date, impact, or name

**Example Display:**
```
Decisions

[2026-03-15] Use Fastify over Express
├─ Status: Active
├─ Impact: High
└─ Summary: Chose Fastify for better performance...

[2026-02-20] Monorepo with npm workspaces
├─ Status: Active
├─ Impact: Medium
└─ Summary: Structured as monorepo to...

Patterns

Factory Pattern for Service Creation
├─ Category: Architecture
└─ Used in: src/services/*, src/lib/*

API Error Handling
├─ Category: API Design
└─ Example: src/api/error-handler.ts
```

### Reviews Tab

Browse past code review reports.

**Components:**

1. **Reviews List**
   - File name
   - Date reviewed
   - LLM model used
   - Summary of issues found

2. **Review Details**
   - Full review report
   - Issues organized by severity
   - Recommendations
   - Code snippets with feedback

3. **Trends**
   - Review frequency
   - Common issues across reviews
   - Improvement over time

**Example Display:**
```
Code Reviews (15 total)

2026-03-22 | src/lib/api.ts | claude-3.5-sonnet
├─ Issues: 3 (1 high, 2 medium)
└─ Summary: Good structure; simplify error handling

2026-03-21 | src/pages/index.tsx | gpt-4o
├─ Issues: 2 (both low)
└─ Summary: Consider extracting components

2026-03-20 | src/utils/helpers.ts | claude-3.5-sonnet
├─ Issues: 1 (low)
└─ Summary: Add TypeScript strict mode checks
```

## Data Flow

```
.devpilot/local/
├─ context.yaml    ─────────→ Health/Git/Coverage cards
├─ health.yaml     ─────────→ Health breakdown, trend
├─ reviews/*       ─────────→ Reviews tab
└─ cache/          ─────────→ Dashboard cache
        ↓
   [Fastify Server]
        ├─ GET /api/health    → health.yaml
        ├─ GET /api/context   → context.yaml (git stats)
        ├─ GET /api/security  → health.yaml (security)
        ├─ GET /api/coverage  → health.yaml (testCoverage)
        ├─ GET /api/memory    → decisions.md, patterns.md
        └─ GET /api/reviews   → reviews/*.md
        ↓
   [Dashboard UI]
        └─ http://localhost:3141
```

## API Routes

The dashboard server exposes REST endpoints for data fetching:

```
GET /api/health
  Returns: { score, breakdown, trend, testCoverage, security }

GET /api/context
  Returns: { stats, techStack, git, scannedAt }

GET /api/memory
  Returns: { decisions: [], patterns: [] }

GET /api/reviews
  Returns: [{ file, date, model, summary, content }]

GET /api/coverage
  Returns: { runner, percentage, hasConfig, trend }

GET /api/security
  Returns: { score, vulnerabilities }
```

## Configuration

### Port Binding

Dashboard automatically binds to first available port starting from 3141:
- Tries 3141 (default)
- Falls back to 3142, 3143, ... if in use
- Displays actual port in console

**Force port:** (Feature for future release)
```bash
devpilot dashboard --port 3000
```

### Localhost Security

- **Binding**: 127.0.0.1 only (no remote access)
- **No authentication**: Assumes local development
- **Data**: Read-only access to .devpilot/local/

### Browser Requirements

- Modern browser with ES6+ support
- No external dependencies (inlined CSS/JS)
- Works offline after initial load

## Real-time Updates

Dashboard includes optional auto-refresh:
- Poll interval: 30 seconds (configurable)
- Updates health, git, coverage, security cards
- Preserves user state (scroll position, selected tab)

**Enable/Disable:**
```javascript
// In dashboard HTML
const AUTO_REFRESH = true;      // true or false
const REFRESH_INTERVAL = 30000; // milliseconds
```

## Customization

### Adding New Cards

To add a custom card to the dashboard:

1. **Add API endpoint** in `lib/server/api-routes.ts`
2. **Create card template** in `lib/server/dashboard-html.ts`
3. **Wire to data** in dashboard UI script

### Styling

Dashboard uses inline CSS. To customize:

1. Edit `lib/server/dashboard-html.ts`
2. Modify CSS section (colors, fonts, layout)
3. Restart dashboard

**Color Scheme:**
```css
--color-success: #10b981   /* Green (90+) */
--color-warning: #f59e0b   /* Yellow (60-89) */
--color-danger: #ef4444    /* Red (0-59) */
--color-primary: #3b82f6   /* Blue */
--color-text: #1f2937      /* Dark gray */
```

## Troubleshooting

### Dashboard Won't Start

```bash
# Check if port is in use
lsof -i :3141

# Kill process on port 3141
kill -9 <PID>

# Restart dashboard
devpilot dashboard
```

### Data Not Updating

```bash
# Check if context exists
cat .devpilot/local/context.yaml

# Run fresh scan
devpilot scan --full

# Restart dashboard
devpilot dashboard
```

### Slow Dashboard Load

- Dashboard is slow on very large projects (100k+ LOC)
- Try limiting scan depth: `devpilot scan --depth 8`
- Use `--exclude` to ignore vendor directories

### Browser Display Issues

- Clear browser cache (Ctrl+Shift+Delete)
- Use different browser to isolate issue
- Check browser console for JavaScript errors

## Performance

### Load Times

| Operation | Time |
|-----------|------|
| Dashboard startup | < 1s |
| Initial page load | 1-2s |
| Health tab render | 0.5s |
| Git tab render | 0.5s |
| Memory tab render | 1-2s |
| Review tab render | 2-3s |

### Optimization Tips

- Run `devpilot scan --full` before opening dashboard
- Use `--exclude` to reduce file count
- Limit scan depth with `--depth`
- Archive old reviews to improve loading

---

**Last Updated**: 2026-03-22
**Version**: 1.0
**Related**: health-scoring.md, scanner-and-context.md
