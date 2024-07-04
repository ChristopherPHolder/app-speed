import { readFileSync, writeFileSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { Metafile } from 'esbuild';

export const INVALID_FILE_PATH_ERROR_MSG = (path: string) => `No file found at ${path}`;

export function getJson<T = any>(path: string) {
  const normalizedPath = normalize(path);
  try {
    return JSON.parse(readFileSync(normalizedPath, {encoding: 'utf-8'})) as T;
  }
  catch (e) {
    throw new Error(INVALID_FILE_PATH_ERROR_MSG(normalizedPath));
  }
}

export function makeJson(path: string, file: any) {
  writeFileSync(join(...[path]), JSON.stringify(file, null, 4), {encoding: 'utf-8'});
}

export function removeDynamicImports(meta: Metafile): void {
  const chunksPaths = Object.keys(meta.outputs);
  for (const chunkPath of chunksPaths) {
    const imports = meta.outputs[chunkPath].imports;
    for (const importIndex in imports) {
      if (imports[importIndex].kind === "dynamic-import") {
        delete meta.outputs[chunkPath].imports[importIndex];
      }
    }
  }
}

const matchesPattern = (fileName: string, patterns: string[]) => patterns.some(substring => fileName.includes(substring));

export function extractEntryPoints(meta: Metafile, patterns: string[]): string[] {
  return Object.keys(meta.outputs).filter(fileName => matchesPattern(fileName, patterns));
}

export function filterMetaFromEntryPoints(meta: Metafile, entryPoints: string[]) {
  const extractedChunks = new Set<string>();
  const alreadyExtractedChildren = (chunk: string) => extractedChunks.has(chunk);
  const addToExtractedChunks = (chunk: string) => extractedChunks.add(chunk) && extractedChunks.add(`${chunk}.map`);
  const childImportedChunks = (chunk: string) => meta['outputs'][chunk]['imports'].filter(({kind}) => kind === "import-statement" || "dynamic-import").map(({path}) => path);
  function extractImport(chunks: string[]) {
    for (const chunk of chunks) {
      if (alreadyExtractedChildren(chunk)) continue;
      addToExtractedChunks(chunk);
      extractImport(childImportedChunks(chunk));
    }
  }
  function removeNotReferencedChunks() {
    const outputChunks = Object.keys(meta['outputs']);
    for (const chunk of outputChunks) {
      if (extractedChunks.has(chunk)) continue;
      delete meta['outputs'][chunk];
    }
  }

  extractImport(entryPoints);
  removeNotReferencedChunks();
}
