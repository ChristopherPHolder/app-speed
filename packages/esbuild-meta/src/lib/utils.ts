import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Metafile } from 'esbuild';

export function getJson<T = any>(path: string[]) {
  return JSON.parse(readFileSync(join(...path), {encoding: 'utf-8'})) as T;
}

export function makeJson(path: string, file: any) {
  writeFileSync(join(...[path]), JSON.stringify(file, null, 4), {encoding: 'utf-8'});
}

export function extractEntryFromManifest(manifest: any) {
  const polyfills = manifest["polyfills.js"].replace('/ClientDist/', '');
  const main = manifest["main.js"].replace('/ClientDist/', '');
  return [main, polyfills];
}

export function filterMetaFromEntryPoints(meta: Metafile, entryPoints: string[]) {
  const extractedChunks = new Set<string>();
  const alreadyExtractedChildren = (chunk: string) => extractedChunks.has(chunk);
  const addToExtractedChunks = (chunk: string) => extractedChunks.add(chunk) && extractedChunks.add(`${chunk}.map`);
  const childImportedChunks = (chunk: string) => meta['outputs'][chunk]['imports'].filter(({kind}) => kind === "import-statement").map(({path}) => path);
  function extractImport(chunks: any) {
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
