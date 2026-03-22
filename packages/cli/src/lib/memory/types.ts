export interface Decision {
  id: string;
  date: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  tags: string[];
  usageCount: number;
  lastUsed: string;
}

export interface Pattern {
  id: string;
  pattern: string;
  scope: string;
  autoDetected: boolean;
  examples: { good?: string; bad?: string }[];
  tags: string[];
  usageCount: number;
  lastUsed: string;
}

export interface MemoryFilter {
  tags?: string[];
  minUsageCount?: number;
  since?: Date;
}
