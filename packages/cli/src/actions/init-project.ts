import { writeFile } from 'fs/promises';
import YAML from 'yaml';
import { ensureDir, getDevpilotPaths, fileExists } from '../lib/file-utils.js';
import { serializeDecisions, serializePatterns } from '../lib/memory/markdown-parser.js';
import { ActionResult } from './types.js';

export interface InitProjectData {
  paths: {
    shared: string;
    local: string;
  };
  alreadyInitialized: boolean;
}

export class InitProjectAction {
  async execute(workingDirectory: string): Promise<ActionResult<InitProjectData>> {
    try {
      const paths = getDevpilotPaths(workingDirectory);

      // Check if already initialized
      if (await fileExists(paths.sharedConfig)) {
        return {
          success: true,
          data: {
            paths: {
              shared: paths.shared,
              local: paths.local,
            },
            alreadyInitialized: true,
          },
        };
      }

      // Create shared directories (git-tracked)
      await ensureDir(paths.shared);
      await ensureDir(paths.sharedMemory);

      // Create local directories (git-ignored)
      await ensureDir(paths.local);
      await ensureDir(paths.localReviews);
      await ensureDir(paths.localCache);

      // Write shared config
      const defaultProjectConfig = {
        excludePatterns: ['node_modules', '.git', 'dist'],
        scanDepth: 10,
      };
      await writeFile(paths.sharedConfig, YAML.stringify(defaultProjectConfig));

      // Write empty memory files (Markdown format)
      await writeFile(paths.sharedDecisions, serializeDecisions([]));
      await writeFile(paths.sharedPatterns, serializePatterns([]));

      return {
        success: true,
        data: {
          paths: {
            shared: paths.shared,
            local: paths.local,
          },
          alreadyInitialized: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during initialization',
      };
    }
  }
}
