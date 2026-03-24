import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreCalculator } from '../src/lib/health/score-calculator.js';
import { readFile } from 'fs/promises';
import type { HealthScore, TestCoverageMetrics, SecurityMetrics } from '../src/lib/health/types.js';

vi.mock('fs/promises');

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    vi.clearAllMocks();
    calculator = new ScoreCalculator();
  });

  describe('overall score with all 6 metrics', () => {
    it('should calculate score with all metrics (weights sum to 1.00)', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 80, avgCyclomaticComplexity: 5, filesOverThreshold: 2, maxComplexity: 15, complexFiles: [] },
        duplication: { score: 85, percentage: 5, duplicatedLines: 100, totalLines: 2000 },
        dependencies: { score: 90, total: 50, outdated: 5, outdatedList: [] },
        fileSize: { score: 75, avgSize: 200, largeFiles: 3, largeFilesList: [] },
      };

      const testCoverage: TestCoverageMetrics = {
        lines: 85,
        statements: 87,
        branches: 80,
        functions: 90,
        runner: 'vitest',
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 0, high: 1, moderate: 2, low: 1, info: 0 },
        total: 4,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, testCoverage, security);

      // Security: 100 - (0*20 + 1*10 + 2*5 + 1*2 + 0*1) = 78
      // testCoverage: (85+87+80+90)/4 = 85.5 → 85 (rounded)
      // Weights: 0.16+0.13+0.13+0.13+0.16+0.13 = 0.84
      // Score: (80*0.16 + 85*0.13 + 90*0.13 + 75*0.13 + 85*0.16 + 78*0.13) / 0.84
      // = 69.04 / 0.84 = 82.19 → 82
      expect(score).toBeCloseTo(82, 0);
    });
  });

  describe('overall score with only 4 metrics (dynamic redistribution)', () => {
    it('should redistribute weights when testCoverage and security are missing', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 80, avgCyclomaticComplexity: 5, filesOverThreshold: 2, maxComplexity: 15, complexFiles: [] },
        duplication: { score: 85, percentage: 5, duplicatedLines: 100, totalLines: 2000 },
        dependencies: { score: 90, total: 50, outdated: 5, outdatedList: [] },
        fileSize: { score: 75, avgSize: 200, largeFiles: 3, largeFilesList: [] },
      };

      const score = calculator.calculateOverallScore(breakdown);

      // Weights: complexity=0.16, duplication=0.13, dependencies=0.13, fileSize=0.13
      // Total weight = 0.55, normalize to 1.0
      // Expected: (0.16*80 + 0.13*85 + 0.13*90 + 0.13*75) / 0.55
      // = (12.8 + 11.05 + 11.7 + 9.75) / 0.55 = 45.3 / 0.55 = 82.36 -> 82
      expect(score).toBeCloseTo(82, 0);
    });

    it('should redistribute weights when only security is missing', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 80, avgCyclomaticComplexity: 5, filesOverThreshold: 2, maxComplexity: 15, complexFiles: [] },
        duplication: { score: 85, percentage: 5, duplicatedLines: 100, totalLines: 2000 },
        dependencies: { score: 90, total: 50, outdated: 5, outdatedList: [] },
        fileSize: { score: 75, avgSize: 200, largeFiles: 3, largeFilesList: [] },
      };

      const testCoverage: TestCoverageMetrics = {
        lines: 88,
        statements: 90,
        branches: 82,
        functions: 92,
        runner: 'vitest',
      };

      const score = calculator.calculateOverallScore(breakdown, testCoverage);

      // Weights: 0.25+0.20+0.20+0.15+0.15 = 0.95
      // testCoverage score = (88+90+82+92)/4 = 88
      // Expected: (0.25*80 + 0.20*85 + 0.20*90 + 0.15*75 + 0.15*88) / 0.95
      expect(score).toBeCloseTo(84, 0);
    });
  });

  describe('testCoverage score calculation', () => {
    it('should calculate testCoverage score as average of 4 percentages', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 100, avgCyclomaticComplexity: 1, filesOverThreshold: 0, maxComplexity: 5, complexFiles: [] },
        duplication: { score: 100, percentage: 0, duplicatedLines: 0, totalLines: 1000 },
        dependencies: { score: 100, total: 10, outdated: 0, outdatedList: [] },
        fileSize: { score: 100, avgSize: 100, largeFiles: 0, largeFilesList: [] },
      };

      const testCoverage: TestCoverageMetrics = {
        lines: 80,
        statements: 85,
        branches: 75,
        functions: 90,
      };

      const score = calculator.calculateOverallScore(breakdown, testCoverage);

      // testCoverage score = (80 + 85 + 75 + 90) / 4 = 82.5 -> 82 (rounded)
      // With all base scores at 100, and testCoverage at 82
      // Expected: (0.80*100 + 0.15*82) / 0.95 = (80 + 12.3) / 0.95 = 97.16 -> 97
      expect(score).toBeGreaterThanOrEqual(96);
      expect(score).toBeLessThanOrEqual(98);
    });

    it('should round testCoverage score correctly', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 0, avgCyclomaticComplexity: 50, filesOverThreshold: 100, maxComplexity: 100, complexFiles: [] },
        duplication: { score: 0, percentage: 50, duplicatedLines: 1000, totalLines: 2000 },
        dependencies: { score: 0, total: 100, outdated: 50, outdatedList: [] },
        fileSize: { score: 0, avgSize: 1000, largeFiles: 50, largeFilesList: [] },
      };

      const testCoverage: TestCoverageMetrics = {
        lines: 85.5,
        statements: 87.2,
        branches: 75.8,
        functions: 90.1,
      };

      const score = calculator.calculateOverallScore(breakdown, testCoverage);

      // testCoverage score = (85.5 + 87.2 + 75.8 + 90.1) / 4 = 84.65 -> 85 (rounded)
      // Base scores all 0, testCoverage 85
      // Weights: breakdown = 0.55, testCoverage = 0.16, total = 0.71
      // Score: (0 + 0.16*85) / 0.71 = 13.6 / 0.71 = 19.14 -> 19
      expect(score).toBeGreaterThanOrEqual(18);
      expect(score).toBeLessThanOrEqual(20);
    });
  });

  describe('security score with deductions', () => {
    it('should deduct 20 points per critical vulnerability', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 100, avgCyclomaticComplexity: 1, filesOverThreshold: 0, maxComplexity: 5, complexFiles: [] },
        duplication: { score: 100, percentage: 0, duplicatedLines: 0, totalLines: 1000 },
        dependencies: { score: 100, total: 10, outdated: 0, outdatedList: [] },
        fileSize: { score: 100, avgSize: 100, largeFiles: 0, largeFilesList: [] },
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 2, high: 0, moderate: 0, low: 0, info: 0 },
        total: 2,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, undefined, security);

      // Security score = 100 - (2 * 20) = 60
      // New weight for security: 0.13
      // Normalized weights: (0.16+0.13+0.13+0.13)*100 + 0.13*60 / 0.68
      // = (16 + 13 + 13 + 13 + 7.8) / 0.68 = 62.8 / 0.68 = 92.35 -> 92
      expect(score).toBeCloseTo(92, 0);
    });

    it('should deduct 10 points per high vulnerability', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 100, avgCyclomaticComplexity: 1, filesOverThreshold: 0, maxComplexity: 5, complexFiles: [] },
        duplication: { score: 100, percentage: 0, duplicatedLines: 0, totalLines: 1000 },
        dependencies: { score: 100, total: 10, outdated: 0, outdatedList: [] },
        fileSize: { score: 100, avgSize: 100, largeFiles: 0, largeFilesList: [] },
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 0, high: 3, moderate: 0, low: 0, info: 0 },
        total: 3,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, undefined, security);

      // Security score = 100 - (3 * 10) = 70
      // (0.16+0.13+0.13+0.13)*100 + 0.13*70 / 0.68
      // = (16 + 13 + 13 + 13 + 9.1) / 0.68 = 64.1 / 0.68 = 94.26 -> 94
      expect(score).toBeCloseTo(94, 0);
    });

    it('should deduct 5 points per moderate vulnerability', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 100, avgCyclomaticComplexity: 1, filesOverThreshold: 0, maxComplexity: 5, complexFiles: [] },
        duplication: { score: 100, percentage: 0, duplicatedLines: 0, totalLines: 1000 },
        dependencies: { score: 100, total: 10, outdated: 0, outdatedList: [] },
        fileSize: { score: 100, avgSize: 100, largeFiles: 0, largeFilesList: [] },
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 0, high: 0, moderate: 4, low: 0, info: 0 },
        total: 4,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, undefined, security);

      // Security score = 100 - (4 * 5) = 80
      // (0.16+0.13+0.13+0.13)*100 + 0.13*80 / 0.68
      // = (16 + 13 + 13 + 13 + 10.4) / 0.68 = 65.4 / 0.68 = 96.18 -> 96
      expect(score).toBeCloseTo(96, 0);
    });

    it('should apply mixed severity deductions correctly', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 100, avgCyclomaticComplexity: 1, filesOverThreshold: 0, maxComplexity: 5, complexFiles: [] },
        duplication: { score: 100, percentage: 0, duplicatedLines: 0, totalLines: 1000 },
        dependencies: { score: 100, total: 10, outdated: 0, outdatedList: [] },
        fileSize: { score: 100, avgSize: 100, largeFiles: 0, largeFilesList: [] },
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 1, high: 2, moderate: 3, low: 5, info: 2 },
        total: 13,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, undefined, security);

      // Security score = 100 - (1*20 + 2*10 + 3*5 + 5*2 + 2*1)
      //                = 100 - (20 + 20 + 15 + 10 + 2) = 100 - 67 = 33
      // (0.16+0.13+0.13+0.13)*100 + 0.13*33 / 0.68
      // = (16 + 13 + 13 + 13 + 4.29) / 0.68 = 59.29 / 0.68 = 87.19 -> 87
      expect(score).toBeCloseTo(87, 0);
    });

    it('should not go below 0 for security score', () => {
      const breakdown: HealthScore['breakdown'] = {
        complexity: { score: 0, avgCyclomaticComplexity: 50, filesOverThreshold: 100, maxComplexity: 100, complexFiles: [] },
        duplication: { score: 0, percentage: 50, duplicatedLines: 1000, totalLines: 2000 },
        dependencies: { score: 0, total: 100, outdated: 50, outdatedList: [] },
        fileSize: { score: 0, avgSize: 1000, largeFiles: 50, largeFilesList: [] },
      };

      const security: SecurityMetrics = {
        vulnerabilities: { critical: 10, high: 10, moderate: 10, low: 10, info: 10 },
        total: 50,
        packages: [],
      };

      const score = calculator.calculateOverallScore(breakdown, undefined, security);

      // Security score = 100 - (10*20 + 10*10 + 10*5 + 10*2 + 10*1)
      //                = 100 - 380 = max(0, -280) = 0
      // Expected: (0 + 0.05*0) / 0.85 = 0
      expect(score).toBe(0);
    });
  });

  describe('calculateFileSizeScore method', () => {
    it('should return score 100 with empty files array', () => {
      const result = calculator.calculateFileSizeScore([]);

      expect(result).toEqual({
        score: 100,
        avgSize: 0,
        largeFiles: 0,
        largeFilesList: [],
      });
    });

    it('should calculate score 60 when >30% files are large (>500 lines)', () => {
      const files = [
        { path: 'file1.ts', lines: 600 },
        { path: 'file2.ts', lines: 700 },
        { path: 'file3.ts', lines: 800 },
        { path: 'file4.ts', lines: 200 },
        { path: 'file5.ts', lines: 300 },
      ];

      const result = calculator.calculateFileSizeScore(files);

      expect(result.score).toBe(60); // 3/5 = 60% > 30%
      expect(result.largeFiles).toBe(3);
      expect(result.avgSize).toBeCloseTo(520, 0);
      expect(result.largeFilesList).toHaveLength(3);
    });

    it('should calculate score 75 when >20% but <=30% files are large', () => {
      const files = [
        { path: 'file1.ts', lines: 600 },
        { path: 'file2.ts', lines: 700 },
        { path: 'file3.ts', lines: 200 },
        { path: 'file4.ts', lines: 300 },
        { path: 'file5.ts', lines: 250 },
        { path: 'file6.ts', lines: 280 },
        { path: 'file7.ts', lines: 220 },
        { path: 'file8.ts', lines: 150 },
      ];

      const result = calculator.calculateFileSizeScore(files);

      expect(result.score).toBe(75); // 2/8 = 25%, which is >20% but <=30%
      expect(result.largeFiles).toBe(2);
    });

    it('should calculate score 85 when >10% but <=20% files are large', () => {
      const files = [
        { path: 'file1.ts', lines: 600 },
        { path: 'file2.ts', lines: 200 },
        { path: 'file3.ts', lines: 300 },
        { path: 'file4.ts', lines: 250 },
        { path: 'file5.ts', lines: 280 },
        { path: 'file6.ts', lines: 220 },
        { path: 'file7.ts', lines: 150 },
      ];

      const result = calculator.calculateFileSizeScore(files);

      expect(result.score).toBe(85); // 1/7 = 14.3%, which is >10% but <=20%
      expect(result.largeFiles).toBe(1);
    });

    it('should calculate score 100 when <=10% files are large', () => {
      const files = [
        { path: 'file1.ts', lines: 200 },
        { path: 'file2.ts', lines: 300 },
        { path: 'file3.ts', lines: 250 },
        { path: 'file4.ts', lines: 280 },
        { path: 'file5.ts', lines: 220 },
        { path: 'file6.ts', lines: 150 },
        { path: 'file7.ts', lines: 180 },
        { path: 'file8.ts', lines: 190 },
        { path: 'file9.ts', lines: 210 },
        { path: 'file10.ts', lines: 230 },
      ];

      const result = calculator.calculateFileSizeScore(files);

      expect(result.score).toBe(100); // 0/10 = 0% <= 10%
      expect(result.largeFiles).toBe(0);
    });

    it('should limit largeFilesList to 5 items', () => {
      const files = Array.from({ length: 10 }, (_, i) => ({
        path: `file${i}.ts`,
        lines: 600 + i * 10,
      }));

      const result = calculator.calculateFileSizeScore(files);

      expect(result.largeFilesList).toHaveLength(5);
      expect(result.largeFiles).toBe(10); // All are >500
    });

    it('should calculate avgSize correctly', () => {
      const files = [
        { path: 'file1.ts', lines: 100 },
        { path: 'file2.ts', lines: 200 },
        { path: 'file3.ts', lines: 300 },
      ];

      const result = calculator.calculateFileSizeScore(files);

      expect(result.avgSize).toBe(200); // (100 + 200 + 300) / 3 = 200
    });
  });
});
