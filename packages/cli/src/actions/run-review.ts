import { join, basename, resolve, relative, isAbsolute } from 'path';
import { writeFile, mkdir, stat, readdir } from 'fs/promises';
import { ProviderManager } from '../lib/llm/provider-manager.js';
import { ReviewContextBuilder } from '../lib/review/review-context-builder.js';
import { PromptBuilder } from '../lib/review/prompt-builder.js';
import { ReviewParser } from '../lib/review/review-parser.js';
import { ReviewFormatter } from '../lib/review/review-formatter.js';
import { getDevpilotPaths } from '../lib/file-utils.js';
import { type ReviewResult } from '../lib/review/types.js';
import { ActionResult } from './types.js';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.swift', '.kt']);

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/^\.+/, '')
    .substring(0, 200);
}

export interface ReviewOptions {
  model?: string;
}

export interface FileReviewResult {
  file: string;
  result: ReviewResult;
  savedPath: string;
}

export class RunReviewAction {
  private contextBuilder: ReviewContextBuilder;
  private promptBuilder: PromptBuilder;
  private reviewParser: ReviewParser;
  private reviewFormatter: ReviewFormatter;
  private providerManager: ProviderManager;

  constructor() {
    this.contextBuilder = new ReviewContextBuilder();
    this.promptBuilder = new PromptBuilder();
    this.reviewParser = new ReviewParser();
    this.reviewFormatter = new ReviewFormatter();
    this.providerManager = new ProviderManager();
  }

  async validateTarget(target: string, rootPath: string): Promise<ActionResult<string[]>> {
    try {
      const resolvedTarget = resolve(target);
      const relPath = relative(rootPath, resolvedTarget);

      // Prevent path traversal — target must be within project directory
      if (relPath.startsWith('..') || isAbsolute(relPath)) {
        return {
          success: false,
          error: 'Target must be within project directory',
        };
      }

      // Determine files to review
      const targetStat = await stat(resolvedTarget);
      let files: string[];

      if (targetStat.isDirectory()) {
        const entries = await readdir(resolvedTarget, { recursive: true });
        files = entries
          .map(f => join(resolvedTarget, f as string))
          .filter(f => CODE_EXTENSIONS.has(f.slice(f.lastIndexOf('.'))));
      } else {
        files = [resolvedTarget];
      }

      if (files.length === 0) {
        return {
          success: false,
          error: 'No code files found to review',
        };
      }

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate target',
      };
    }
  }

  async *streamReview(
    file: string,
    rootPath: string,
    options: ReviewOptions = {},
  ): AsyncGenerator<string | FileReviewResult> {
    // Build context and prompts
    const context = await this.contextBuilder.build(file, rootPath);
    const systemPrompt = this.promptBuilder.buildSystemPrompt(context);
    const userPrompt = this.promptBuilder.buildUserPrompt(context);

    // Generate review via LLM streaming
    let fullReviewText = '';
    const stream = this.providerManager.stream(userPrompt, {
      model: options.model,
      systemPrompt,
      maxTokens: 4096,
    });

    for await (const chunk of stream) {
      fullReviewText += chunk;
      yield chunk;
    }

    // Parse and save review — yield final result
    const result = this.reviewParser.parse(fullReviewText, file, options.model || 'default');
    const savedPath = await this.saveReview(file, rootPath, result, fullReviewText);

    yield { file, result, savedPath };
  }

  async saveReview(
    file: string,
    rootPath: string,
    result: ReviewResult,
    fullText: string,
  ): Promise<string> {
    const paths = getDevpilotPaths(rootPath);
    await mkdir(paths.localReviews, { recursive: true });

    const safeName = sanitizeFilename(basename(file).replace(/\.[^.]+$/, ''));
    const reviewFileName = `${result.date}-${safeName}.md`;
    const reviewPath = join(paths.localReviews, reviewFileName);
    const markdown = this.reviewFormatter.formatMarkdown(result, fullText);
    await writeFile(reviewPath, markdown);

    return reviewPath;
  }

  getFormatter(): ReviewFormatter {
    return this.reviewFormatter;
  }
}
