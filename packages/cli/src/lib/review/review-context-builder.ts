import { readFile } from 'fs/promises';
import { join } from 'path';
import YAML from 'yaml';
import { MemoryManager } from '../memory/memory-manager.js';
import { ReviewContext } from './types.js';
import { getDevpilotPaths } from '../file-utils.js';

export class ReviewContextBuilder {
  async build(filePath: string, projectRoot: string = process.cwd()): Promise<ReviewContext> {
    const paths = getDevpilotPaths(projectRoot);

    // Load project context
    let projectContext: Record<string, unknown> = {};
    try {
      const content = await readFile(paths.context, 'utf-8');
      projectContext = YAML.parse(content) ?? {};
    } catch {
      // No context yet
    }

    // Load memory
    const memoryManager = new MemoryManager(projectRoot);
    const decisions = await memoryManager.getDecisions();
    const patterns = await memoryManager.getPatterns();

    // Read file content
    const fileContent = await readFile(filePath, 'utf-8');

    return { projectContext, decisions, patterns, fileContent, filePath };
  }
}
