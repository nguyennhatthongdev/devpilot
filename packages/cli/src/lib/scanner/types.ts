export interface FileStats {
  files: number;
  lines: number;
}

export interface TechStack {
  frameworks: string[];
  language: string;
  packageManager?: string;
  nodeVersion?: string;
}

export interface GitStats {
  commits: number;
  contributors: number;
  branches: number;
  currentBranch: string;
  firstCommit: string;
  lastCommit: string;
  commitsPerWeek: number;
}

export interface ContextData {
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
  dependencies: {
    runtime: Record<string, string>;
    dev: Record<string, string>;
  };
  fileStructure: {
    directories: number;
    largestFiles: Array<{ path: string; lines: number; size: number }>;
  };
  git?: GitStats;
  testCoverage?: { runner?: string; percentage?: number; hasConfig: boolean };
  excludePatterns: string[];
}
