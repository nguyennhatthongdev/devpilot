import { join } from 'path';
import { writeFile } from 'fs/promises';
import ora from 'ora';
import chalk from 'chalk';
import YAML from 'yaml';
import { FileWalker } from '../lib/scanner/file-walker.js';
import { IgnoreFilter } from '../lib/scanner/ignore-filter.js';
import { TechDetector } from '../lib/scanner/tech-detector.js';
import { ContextBuilder } from '../lib/scanner/context-builder.js';
import { ConfigManager } from '../lib/config-manager.js';
import { ensureDir, getDevpilotPaths } from '../lib/file-utils.js';
import { PatternDetector } from '../lib/memory/pattern-detector.js';
import { MemoryManager } from '../lib/memory/memory-manager.js';

export async function scanCommand(options: {
  depth?: string;
  exclude?: string;
  full?: boolean;
}) {
  const spinner = ora('Scanning codebase...').start();

  try {
    const rootPath = process.cwd();
    const configManager = new ConfigManager();
    const config = await configManager.mergeConfigs(rootPath);
    const paths = getDevpilotPaths(rootPath);

    // Initialize components
    const walker = new FileWalker();
    const ignoreFilter = new IgnoreFilter();
    const techDetector = new TechDetector();
    const contextBuilder = new ContextBuilder();

    // Load ignore patterns
    await ignoreFilter.loadIgnoreFile(rootPath, '.gitignore');
    await ignoreFilter.loadIgnoreFile(rootPath, '.devpilotignore');
    ignoreFilter.addPatterns(config.projectDefaults.excludePatterns);
    if (options.exclude) {
      ignoreFilter.addPatterns(options.exclude.split(','));
    }

    // Walk files
    const maxDepth = options.depth ? parseInt(options.depth, 10) : config.projectDefaults.scanDepth;
    const allFiles = await walker.walk(rootPath, maxDepth);
    const files = ignoreFilter.filter(allFiles, rootPath);

    spinner.text = `Analyzing ${files.length} files...`;

    // Detect tech stack and dependencies
    const techStack = await techDetector.detect(rootPath, files);
    const dependencies = await techDetector.extractDependencies(rootPath);

    // Build context
    const contextData = await contextBuilder.build(
      files, rootPath, techStack, dependencies, config.projectDefaults.excludePatterns,
    );

    // Save to .devpilot/local/context.yaml
    await ensureDir(paths.local);
    await writeFile(paths.context, YAML.stringify(contextData));

    spinner.succeed(chalk.green('Scan complete!'));

    // Display summary
    console.log(chalk.blue('\nProject Summary:'));
    console.log(`  Files: ${contextData.stats.totalFiles}`);
    console.log(`  Lines of Code: ${contextData.stats.totalLines.toLocaleString()}`);
    console.log(`  Language: ${techStack.language}`);
    if (techStack.frameworks.length > 0) {
      console.log(`  Frameworks: ${techStack.frameworks.join(', ')}`);
    }
    if (techStack.packageManager) {
      console.log(`  Package Manager: ${techStack.packageManager}`);
    }
    console.log(`\n${chalk.green('✓')} Context saved to ${chalk.dim('.devpilot/local/context.yaml')}`);

    // Auto-detect patterns
    try {
      const patternDetector = new PatternDetector();
      const detectedPatterns = patternDetector.detectPatterns(contextData);
      if (detectedPatterns.length > 0) {
        const memoryManager = new MemoryManager(rootPath);
        for (const pattern of detectedPatterns) {
          await memoryManager.addPattern(pattern);
        }
        console.log(chalk.green(`✓ Auto-detected ${detectedPatterns.length} pattern(s)`));
      }
    } catch {
      // Memory not initialized yet, skip pattern detection
    }
  } catch (error) {
    spinner.fail(chalk.red('Scan failed'));
    console.error(error);
    process.exit(1);
  }
}
