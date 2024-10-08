import { readFileSync, writeFileSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { Metafile } from 'esbuild';

export const INVALID_FILE_PATH_ERROR_MSG = (path: string) => `No file found at ${path}`;

export function getJson<T = any>(path: string) {
  const normalizedPath = normalize(path);
  try {
    return JSON.parse(readFileSync(normalizedPath, { encoding: 'utf-8' })) as T;
  } catch (e) {
    throw new Error(INVALID_FILE_PATH_ERROR_MSG(normalizedPath));
  }
}

export function makeJson(path: string, file: any) {
  writeFileSync(join(...[path]), JSON.stringify(file, null, 4), { encoding: 'utf-8' });
}

function importsInEntryPoint(
  entryPoint: string,
  metaFileOutputs: Metafile['outputs'],
  traversedImports = [entryPoint],
): string[] {
  const staticImports = metaFileOutputs[entryPoint].imports.filter(
    ({ kind, path }) => kind !== 'dynamic-import' && !traversedImports.includes(path),
  );

  if (!staticImports.length) {
    return traversedImports;
  }

  return staticImports.flatMap(({ path }) => importsInEntryPoint(path, metaFileOutputs, [...traversedImports, path]));
}

export function removeDynamicImports(meta: Metafile): void {
  Object.entries(meta.outputs).forEach(([name, { imports }]) => {
    meta.outputs[name]['imports'] = imports.filter(({ kind }) => kind !== 'dynamic-import');
  });
}

const matchesPattern = (fileName: string, patterns: string[]) =>
  patterns.some((substring) => fileName.includes(substring));

export function extractEntryPoints(meta: Metafile, patterns: string[]): string[] {
  return Object.keys(meta.outputs).filter((fileName) => matchesPattern(fileName, patterns));
}

export function filterMetaFromEntryPoints(meta: Metafile, entryPoints: string[]) {
  const initialChunks = new Set(entryPoints.flatMap((e) => importsInEntryPoint(e, meta.outputs)));

  Object.keys(meta.outputs)
    .filter((path) => !initialChunks.has(path))
    .forEach((path) => delete meta['outputs'][path]);
}
