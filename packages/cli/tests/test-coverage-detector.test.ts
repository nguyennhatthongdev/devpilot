import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestCoverageDetector } from '../src/lib/health/test-coverage-detector.js';
import { readFile } from 'fs/promises';

vi.mock('fs/promises');

describe('TestCoverageDetector', () => {
  let detector: TestCoverageDetector;
  const projectRoot = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new TestCoverageDetector(projectRoot);
  });

  describe('coverage-summary.json parsing (vitest/jest format)', () => {
    it('should parse coverage-summary.json with all metrics', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 85.5 },
          statements: { pct: 87.2 },
          branches: { pct: 75.0 },
          functions: { pct: 90.0 },
        },
      };

      const mockPackageJson = {
        devDependencies: { vitest: '^1.0.0' },
      };

      // Order: detectTestRunner reads package.json first, then coverage-summary.json
      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result).toEqual({
        lines: 85.5,
        statements: 87.2,
        branches: 75.0,
        functions: 90.0,
        runner: 'vitest',
      });
    });

    it('should handle missing total field', async () => {
      const mockSummary = { other: {} };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify({});
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result).toBeUndefined();
    });

    it('should default to 0 for missing percentage fields', async () => {
      const mockSummary = {
        total: {
          lines: {},
          statements: { pct: 80 },
        },
      };

      const mockPackageJson = {
        devDependencies: { jest: '^29.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.lines).toBe(0);
      expect(result?.statements).toBe(80);
      expect(result?.branches).toBe(0);
      expect(result?.functions).toBe(0);
      expect(result?.runner).toBe('jest');
    });
  });

  describe('lcov.info parsing (nyc/c8 format)', () => {
    it('should parse lcov.info with all metrics', async () => {
      const mockLcov = `
TN:
SF:/project/src/app.ts
FNF:20
FNH:18
DA:1,1
DA:2,0
LF:100
LH:85
BRF:50
BRH:40
end_of_record
`;

      const mockPackageJson = {
        devDependencies: { nyc: '^15.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            throw new Error('coverage-summary.json not found');
          }
          if (path.toString().includes('lcov.info')) {
            return mockLcov;
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result).toEqual({
        lines: 85,        // 85/100 * 100
        statements: 85,   // Same as lines
        branches: 80,     // 40/50 * 100
        functions: 90,    // 18/20 * 100
        runner: 'nyc',
        branchesUnavailable: false,
      });
    });

    it('should handle lcov.info with zero branches', async () => {
      const mockLcov = `
TN:
SF:/project/src/util.ts
LF:50
LH:45
BRF:0
BRH:0
FNF:10
FNH:10
end_of_record
`;

      const mockPackageJson = {
        devDependencies: { c8: '^8.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            throw new Error('coverage-summary.json not found');
          }
          if (path.toString().includes('lcov.info')) {
            return mockLcov;
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.branches).toBe(0);
      expect(result?.runner).toBe('c8');
    });

    it('should aggregate multiple file entries in lcov.info', async () => {
      const mockLcov = `
TN:
SF:/project/src/app.ts
LF:100
LH:85
BRF:50
BRH:40
FNF:20
FNH:18
end_of_record
TN:
SF:/project/src/util.ts
LF:50
LH:45
BRF:20
BRH:18
FNF:5
FNH:5
end_of_record
`;

      const mockPackageJson = {
        devDependencies: { nyc: '^15.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            throw new Error('coverage-summary.json not found');
          }
          if (path.toString().includes('lcov.info')) {
            return mockLcov;
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.lines).toBeCloseTo(86.67, 1); // (85+45)/(100+50) * 100
      expect(result?.branches).toBeCloseTo(82.86, 1); // (40+18)/(50+20) * 100
      expect(result?.functions).toBe(92); // (18+5)/(20+5) * 100
    });

    it('should return undefined if linesFound is 0', async () => {
      const mockLcov = `
TN:
SF:/project/src/empty.ts
LF:0
LH:0
end_of_record
`;

      vi.mocked(readFile)
        .mockRejectedValueOnce(new Error('coverage-summary.json not found'))
        .mockResolvedValueOnce(mockLcov)
        .mockResolvedValueOnce(JSON.stringify({}));

      const result = await detector.detect();

      expect(result).toBeUndefined();
    });
  });

  describe('no coverage files found', () => {
    it('should return undefined if no coverage files exist', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await detector.detect();

      expect(result).toBeUndefined();
    });
  });

  describe('test runner detection', () => {
    it('should detect vitest from devDependencies', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 80 },
          statements: { pct: 80 },
          branches: { pct: 70 },
          functions: { pct: 85 },
        },
      };

      const mockPackageJson = {
        devDependencies: { vitest: '^1.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.runner).toBe('vitest');
    });

    it('should detect jest from test script', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 80 },
          statements: { pct: 80 },
          branches: { pct: 70 },
          functions: { pct: 85 },
        },
      };

      const mockPackageJson = {
        scripts: { test: 'jest' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.runner).toBe('jest');
    });

    it('should detect nyc from test script', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 80 },
          statements: { pct: 80 },
          branches: { pct: 70 },
          functions: { pct: 85 },
        },
      };

      const mockPackageJson = {
        scripts: { test: 'nyc mocha' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.runner).toBe('nyc');
    });

    it('should detect c8 from dependencies', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 80 },
          statements: { pct: 80 },
          branches: { pct: 70 },
          functions: { pct: 85 },
        },
      };

      const mockPackageJson = {
        dependencies: { c8: '^8.0.0' },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify(mockPackageJson);
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.runner).toBe('c8');
    });

    it('should return undefined runner if not detected', async () => {
      const mockSummary = {
        total: {
          lines: { pct: 80 },
          statements: { pct: 80 },
          branches: { pct: 70 },
          functions: { pct: 85 },
        },
      };

      vi.mocked(readFile)
        .mockImplementation(async (path: any) => {
          if (path.toString().includes('package.json')) {
            return JSON.stringify({});
          }
          if (path.toString().includes('coverage-summary.json')) {
            return JSON.stringify(mockSummary);
          }
          throw new Error('File not found');
        });

      const result = await detector.detect();

      expect(result?.runner).toBeUndefined();
    });
  });
});
