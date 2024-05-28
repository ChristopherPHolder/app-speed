import { readFileSync, rmSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

import { Metafile } from 'esbuild';
import { ManualChunksOption, OutputOptions, PreRenderedChunk, rollup } from 'rollup';

import { BundleExecutorSchema } from './schema';

const POLYFILLS_ENTRY_POINT = 'angular:polyfills:angular:polyfills';
const statsJsonPath = (outputPath: string) => join(outputPath,'stats.json');
const entryChunkPath = (outputPath: string, chunkName: string) => join(outputPath, chunkName);
const noEntryChunkError = () => new Error('No entry chunk found matching @TODO improve error message');
const chunkWithEntryPoint = (entryPoint: string, outputChunks: Metafile['outputs']): string | undefined => {
  return Object.keys(outputChunks).find(output => outputChunks[output].entryPoint === entryPoint);
};
const entryChunk = (entryPoint: string, statsJson: Metafile): string => {
  const chunkName = chunkWithEntryPoint(entryPoint, statsJson.outputs);
  if (!chunkName) throw noEntryChunkError();
  return chunkName;
}

function getJson<T = unknown>(path: string) {
  return JSON.parse(readFileSync(join(path), {encoding: 'utf-8'})) as T;
}

export default async function runExecutor(options: BundleExecutorSchema) {
  console.log('Executor ran for Bundle', options);

  const statsJson = getJson<Metafile>(statsJsonPath(options.outputPath));
  const mainChunk = entryChunk(options.main, statsJson);
  const polyfillsChunk = entryChunk(POLYFILLS_ENTRY_POINT, statsJson);
  const input = [entryChunkPath(options.outputPath, mainChunk), entryChunkPath(options.outputPath, polyfillsChunk)];

  const dir = join('tmp', options.outputPath);

  const manualChunks: ManualChunksOption = (id) => {
    if (id.includes(mainChunk) || id.includes(polyfillsChunk)) return;
    if (id.includes("chunk")) return "extra";
    return 'vendor';
  };

  const chunkFileNames = (chunkInfo: PreRenderedChunk): string => {
    return `${chunkInfo.type}-${chunkInfo.name}.js`;
  }
  const output: OutputOptions = {
    manualChunks,
    chunkFileNames,
    dir
  };
  const b = await rollup({ input });
  await b.write(output);

  for (const output of Object.keys(statsJson.outputs)) {
    if (!output.endsWith('.css')) rmSync(join(options.outputPath, output));
  }

  for (const output of readdirSync(dir)) {
    renameSync(join(dir, output), join(options.outputPath, output));
  }

  rmSync(dir, {recursive: true});

  return { success: true };
}
