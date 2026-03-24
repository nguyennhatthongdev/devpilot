export interface ComplexityMetrics {
  score: number;
  avgCyclomaticComplexity: number;
  filesOverThreshold: number;
  maxComplexity: number;
  complexFiles: Array<{ file: string; complexity: number }>;
}

export interface DuplicationMetrics {
  score: number;
  percentage: number;
  duplicatedLines: number;
  totalLines: number;
}

export interface DependencyMetrics {
  score: number;
  total: number;
  outdated: number;
  outdatedList: Array<{ name: string; current: string; latest: string }>;
}

export interface FileSizeMetrics {
  score: number;
  avgSize: number;
  largeFiles: number;
  largeFilesList: Array<{ file: string; lines: number }>;
}

export interface TestCoverageMetrics {
  lines: number;
  statements: number;
  branches: number;
  functions: number;
  /** true when branches data unavailable (branchesFound=0 in LCOV) */
  branchesUnavailable?: boolean;
  runner?: string;
}

export interface SecurityMetrics {
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
  };
  total: number;
  packages: Array<{
    name: string;
    severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
    via: string;
  }>;
}

// Phase 3 analyzer metrics

export interface StyleConsistencyMetrics {
  score: number;
  dominantStyle: 'camelCase' | 'snake_case' | 'PascalCase' | 'mixed';
  styleDistribution: {
    camelCase: number;
    snake_case: number;
    PascalCase: number;
  };
  inconsistentFiles: Array<{ file: string; styles: string[] }>;
}

export interface DeadCodeMetrics {
  score: number;
  unusedExports: number;
  unusedFiles: number;
  details: Array<{
    file: string;
    export: string;
    type: 'function' | 'class' | 'variable' | 'unknown';
  }>;
}

export interface TodoMetrics {
  score: number;
  total: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  oldest?: { file: string; line: number; age: number; message: string };
  items: Array<{
    type: string;
    priority: 0 | 1 | 2 | 3;
    file: string;
    line: number;
    message: string;
    author?: string;
    date?: string;
  }>;
}

export interface DocCoverageMetrics {
  score: number;
  publicFunctions: number;
  documented: number;
  coverage: number;
  undocumentedFiles: Array<{ file: string; missing: number }>;
}

export interface ImportCycleMetrics {
  score: number;
  cycleCount: number;
  cycles: Array<{ path: string[]; length: number }>;
}

export interface HealthScore {
  scannedAt: string;
  overallScore: number;
  breakdown: {
    complexity: ComplexityMetrics;
    duplication: DuplicationMetrics;
    dependencies: DependencyMetrics;
    fileSize: FileSizeMetrics;
    // Phase 3 analyzers
    styleConsistency?: StyleConsistencyMetrics;
    deadCode?: DeadCodeMetrics;
    todos?: TodoMetrics;
    docCoverage?: DocCoverageMetrics;
    importCycles?: ImportCycleMetrics;
  };
  testCoverage?: TestCoverageMetrics;
  security?: SecurityMetrics;
  trend?: 'improving' | 'stable' | 'declining';
}
