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

const matchesPattern = (fileName: string, patterns: string[]) => {
  return fileName && patterns.some((substring) => fileName.includes(substring));
};
export function extractEntryPoints(meta: Metafile, patterns: string[]): string[] {
  return Object.keys(meta.outputs).filter((fileName) => matchesPattern(meta.outputs[fileName].entryPoint, patterns));
}

export function filterMetaFromEntryPoints(meta: Metafile, entryPoints: string[]) {
  const initialChunks = new Set(entryPoints.flatMap((e) => importsInEntryPoint(e, meta.outputs)));

  Object.keys(meta.outputs)
    .filter((path) => !initialChunks.has(path))
    .forEach((path) => delete meta['outputs'][path]);
}

// The path to your stats json output goes here!
const STATS_JSON_PATH = 'stats.json';
// The entry points of your application go here!
const ENTRY_STATS = [
  'apps/internet-bank/src/main.ts',
  'apps/internet-bank/src/bootstrap.ts',
  'angular:script/global:acorn.js',
  'angular:polyfills:angular:polyfills',
  'angular:styles/global:styles',
];
const OUTPUT_STATS = 'initial-stats.json';

function dynamicEntries(metafile: Metafile, entries: string[]) {
  return entries
    .flatMap((entry) => metafile.outputs[entry].imports.filter(({ kind }) => kind === 'dynamic-import'))
    .filter((item, index, array) => array.indexOf(item) === index)
    .map(({ path }) => metafile.outputs[path].entryPoint);
}

(() => {
  const metafile = getJson<Metafile>(STATS_JSON_PATH);
  const entryPoints = extractEntryPoints(metafile, ENTRY_STATS);

  const dynamicEntriesFromSpecifiedEntry = dynamicEntries(metafile, entryPoints).filter(
    (v) => !entryPoints.includes(v),
  );
  console.info('Dynamic imports from this chunk', dynamicEntriesFromSpecifiedEntry);

  filterMetaFromEntryPoints(metafile, entryPoints);
  makeJson(OUTPUT_STATS, metafile);
})();
