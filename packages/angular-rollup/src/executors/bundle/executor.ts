import { readFileSync, rmSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Metafile } from 'esbuild';
import { ManualChunksOption, OutputOptions, PreRenderedChunk, rollup } from 'rollup';

import { BundleExecutorSchema } from './schema';
import { replaceChunkPreLoaders } from './html-transformer';
import { balanceMetaOutputs } from './rollup-stats';

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
  const balancedOutputLookup = balanceMetaOutputs(options.maxChunks, mainChunk, statsJson.outputs);

  const manualChunks: ManualChunksOption = (id) => {
    const chunkName = id.split('\\').at(-1)!;
    const balancedChunk = balancedOutputLookup[chunkName];
    if (balancedChunk) {
      return balancedChunk;
    }
  };

  const chunkFileNames = (chunkInfo: PreRenderedChunk): string => {
    if (!chunkInfo.name.includes('chunk')) {
      return `${chunkInfo.type}-r-${chunkInfo.name}.js`;
    }
    return `${chunkInfo.name}.js`;
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

  const html = readFileSync(join(options.outputPath, 'index.html'), { encoding: 'utf-8' });
  const modifiedHTML = replaceChunkPreLoaders(html, []); // @TODO
  writeFileSync(join(options.outputPath, 'index.html'), modifiedHTML, { encoding: 'utf-8' });

  for (const output of readdirSync(dir)) {
    renameSync(join(dir, output), join(options.outputPath, output));
  }

  rmSync(dir, {recursive: true});

  return { success: true };
}
