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

export interface HealthScore {
  scannedAt: string;
  overallScore: number;
  breakdown: {
    complexity: ComplexityMetrics;
    duplication: DuplicationMetrics;
    dependencies: DependencyMetrics;
    fileSize: FileSizeMetrics;
  };
  trend?: 'improving' | 'stable' | 'declining';
}
