import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { ExecutorContext, logger, type PromiseExecutor } from '@nx/devkit';
import { Effect } from 'effect';

import { type EffectDiagnosticsExecutorSchema } from './schema';

const runExecutor: PromiseExecutor<EffectDiagnosticsExecutorSchema> = async (options, context: ExecutorContext) => {
  return Effect.runPromise(
    Effect.gen(function* () {
      const workspaceRoot = context.root ?? process.cwd();
      const cwd = path.resolve(workspaceRoot, options.cwd ?? '.');
      const projectPath = options.tsConfig
        ? path.isAbsolute(options.tsConfig)
          ? options.tsConfig
          : path.resolve(workspaceRoot, options.tsConfig)
        : undefined;
      const filePath = options.file
        ? path.isAbsolute(options.file)
          ? options.file
          : path.resolve(workspaceRoot, options.file)
        : undefined;

      if (!projectPath && !filePath) {
        logger.error('Either "tsConfig" or "file" must be provided.');
        return { success: false };
      }

      const args = [
        'exec',
        'effect-language-service',
        'diagnostics',
        ...(projectPath ? ['--project', projectPath] : []),
        ...(filePath ? ['--file', filePath] : []),
        ...(options.format ? ['--format', options.format] : []),
        ...(options.severity ? ['--severity', options.severity] : []),
        ...(options.strict ? ['--strict'] : []),
        ...(options.progress ? ['--progress'] : []),
        ...(options.args ?? []),
      ];

      const result = yield* Effect.async<{ exitCode: number; stdout: string }, Error>((resume) => {
        const child = spawn(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
          cwd,
          shell: process.platform === 'win32',
          stdio: ['inherit', 'pipe', 'pipe'],
        });

        let stdout = '';

        child.stdout.on('data', (chunk: Buffer) => {
          const text = chunk.toString();
          stdout += text;
          process.stdout.write(text);
        });

        child.stderr.on('data', (chunk: Buffer) => {
          process.stderr.write(chunk.toString());
        });

        child.on('error', (error) => resume(Effect.fail(error)));
        child.on('close', (code) => resume(Effect.succeed({ exitCode: code ?? 1, stdout })));
      });

      if (options.outputFile) {
        const outputFilePath = path.isAbsolute(options.outputFile)
          ? options.outputFile
          : path.resolve(workspaceRoot, options.outputFile);
        yield* Effect.promise(() => mkdir(path.dirname(outputFilePath), { recursive: true }));
        yield* Effect.promise(() => writeFile(outputFilePath, result.stdout, 'utf8'));
        logger.info(`Wrote diagnostics output to ${outputFilePath}`);
      }

      if (result.exitCode !== 0) {
        logger.error(`effect-language-service diagnostics failed with exit code ${result.exitCode}`);
        logger.error('Ensure workspace dependencies are installed and TypeScript is available locally (pnpm install).');
        return { success: false };
      }

      return { success: true };
    }).pipe(
      Effect.catchAll((error) =>
        Effect.sync(() => {
          logger.error(`Failed to execute effect-language-service diagnostics: ${String(error)}`);
          return { success: false };
        }),
      ),
    ),
  );
};

export default runExecutor;
