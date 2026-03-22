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

export interface ContextData {
  scannedAt: string;
  projectRoot: string;
  stats: {
    totalFiles: number;
    totalLines: number;
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
  excludePatterns: string[];
}
