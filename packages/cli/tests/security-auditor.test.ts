import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, writeFile, stat, mkdir } from 'fs/promises';

// Create mock execAsync function that we can control
const mockExecAsync = vi.fn();

// Mock child_process and util before importing SecurityAuditor
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => mockExecAsync)
}));

vi.mock('fs/promises');

// Import after mocking
const { SecurityAuditor } = await import('../src/lib/health/security-auditor.js');

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditor;
  const projectRoot = '/test/project';
  const cachePath = '/test/project/.devpilot/local/cache/npm-audit.json';

  beforeEach(() => {
    vi.clearAllMocks();
    auditor = new SecurityAuditor(projectRoot);
  });

  describe('npm audit JSON parsing with vulnerabilities', () => {
    it('should parse npm audit output with exit code 1 (vulnerabilities found)', async () => {
      const mockAuditOutput = {
        vulnerabilities: {
          'lodash': {
            severity: 'high',
            via: [{ title: 'Prototype Pollution' }],
          },
          'minimist': {
            severity: 'moderate',
            via: [{ title: 'Prototype Pollution in minimist' }],
          },
          'axios': {
            severity: 'critical',
            via: [{ title: 'SSRF vulnerability' }],
          },
        },
      };

      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result).toEqual({
        vulnerabilities: {
          critical: 1,
          high: 1,
          moderate: 1,
          low: 0,
          info: 0,
        },
        total: 3,
        packages: [
          { name: 'lodash', severity: 'high', via: 'Prototype Pollution' },
          { name: 'minimist', severity: 'moderate', via: 'Prototype Pollution in minimist' },
          { name: 'axios', severity: 'critical', via: 'SSRF vulnerability' },
        ],
      });
    });

    it('should count multiple vulnerabilities by severity correctly', async () => {
      const mockAuditOutput = {
        vulnerabilities: {
          'pkg1': { severity: 'critical', via: [{ title: 'Issue 1' }] },
          'pkg2': { severity: 'critical', via: [{ title: 'Issue 2' }] },
          'pkg3': { severity: 'high', via: [{ title: 'Issue 3' }] },
          'pkg4': { severity: 'high', via: [{ title: 'Issue 4' }] },
          'pkg5': { severity: 'high', via: [{ title: 'Issue 5' }] },
          'pkg6': { severity: 'moderate', via: [{ title: 'Issue 6' }] },
          'pkg7': { severity: 'low', via: [{ title: 'Issue 7' }] },
          'pkg8': { severity: 'info', via: [{ title: 'Issue 8' }] },
        },
      };

      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result?.vulnerabilities).toEqual({
        critical: 2,
        high: 3,
        moderate: 1,
        low: 1,
        info: 1,
      });
      expect(result?.total).toBe(8);
    });

    it('should handle via field as non-array or missing title', async () => {
      const mockAuditOutput = {
        vulnerabilities: {
          'pkg1': { severity: 'high', via: 'string-value' },
          'pkg2': { severity: 'moderate', via: [] },
          'pkg3': { severity: 'low', via: [{}] },
        },
      };

      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result?.packages).toEqual([
        { name: 'pkg1', severity: 'high', via: 'Unknown' },
        { name: 'pkg2', severity: 'moderate', via: 'Unknown' },
        { name: 'pkg3', severity: 'low', via: 'Unknown' },
      ]);
    });
  });

  describe('cache loading', () => {
    it('should return cached result if cache is less than 24h old', async () => {
      const cachedMetrics = {
        vulnerabilities: {
          critical: 1,
          high: 2,
          moderate: 3,
          low: 4,
          info: 5,
        },
        total: 15,
        packages: [],
      };

      const recentTime = Date.now() - (12 * 60 * 60 * 1000); // 12 hours ago

      vi.mocked(stat).mockResolvedValue({
        mtimeMs: recentTime,
      } as any);

      vi.mocked(readFile).mockResolvedValue(JSON.stringify(cachedMetrics));

      const result = await auditor.audit();

      expect(result).toEqual(cachedMetrics);
    });

    it('should run fresh audit if cache is more than 24h old', async () => {
      const oldTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      vi.mocked(stat).mockResolvedValue({
        mtimeMs: oldTime,
      } as any);

      const mockAuditOutput = {
        vulnerabilities: {
          'test-pkg': { severity: 'high', via: [{ title: 'Test issue' }] },
        },
      };

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result?.total).toBe(1);
      expect(mockExecAsync).toHaveBeenCalled();
    });

    it('should run fresh audit if cache does not exist', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const mockAuditOutput = {
        vulnerabilities: {
          'test-pkg': { severity: 'moderate', via: [{ title: 'Test' }] },
        },
      };

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result?.total).toBe(1);
      expect(mockExecAsync).toHaveBeenCalled();
    });
  });

  describe('timeout handling', () => {
    it('should return undefined on timeout (error.killed = true)', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const error: any = new Error('Command timed out');
      error.killed = true;
      mockExecAsync.mockRejectedValue(error);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await auditor.audit();

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Security audit timed out (>30s)');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('cache saving', () => {
    it('should save audit results to cache', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const mockAuditOutput = {
        vulnerabilities: {
          'test-pkg': { severity: 'high', via: [{ title: 'Test issue' }] },
        },
      };

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await auditor.audit();

      expect(mkdir).toHaveBeenCalledWith('/test/project/.devpilot/local/cache', { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(
        cachePath,
        expect.stringContaining('"total": 1'),
        'utf-8'
      );
    });

    it('should continue if cache save fails', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const mockAuditOutput = {
        vulnerabilities: {
          'test-pkg': { severity: 'high', via: [{ title: 'Test' }] },
        },
      };

      mockExecAsync.mockRejectedValue({
        stdout: JSON.stringify(mockAuditOutput),
      });

      vi.mocked(mkdir).mockRejectedValue(new Error('Permission denied'));

      const result = await auditor.audit();

      expect(result?.total).toBe(1); // Audit still succeeds
    });
  });

  describe('error handling', () => {
    it('should return undefined if npm audit fails without stdout', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockRejectedValue(new Error('npm not found'));

      const result = await auditor.audit();

      expect(result).toBeUndefined();
    });

    it('should return undefined if audit output is invalid JSON', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockRejectedValue({
        stdout: 'invalid json{{{',
      });

      const result = await auditor.audit();

      expect(result).toBeUndefined();
    });

    it('should handle no vulnerabilities found (success response)', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      const mockAuditOutput = {
        vulnerabilities: {},
      };

      mockExecAsync.mockResolvedValue({
        stdout: JSON.stringify(mockAuditOutput),
        stderr: '',
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await auditor.audit();

      expect(result?.total).toBe(0);
      expect(result?.vulnerabilities).toEqual({
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        info: 0,
      });
    });
  });

  describe('command execution', () => {
    it('should use correct cwd and timeout for npm audit', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('ENOENT'));

      mockExecAsync.mockImplementation((cmd: string, opts: any) => {
        expect(cmd).toBe('npm audit --json');
        expect(opts.cwd).toBe('/test/project');
        expect(opts.timeout).toBe(30000);
        return Promise.resolve({ stdout: '{"vulnerabilities":{}}', stderr: '' });
      });

      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      await auditor.audit();

      expect(mockExecAsync).toHaveBeenCalled();
    });
  });
});
