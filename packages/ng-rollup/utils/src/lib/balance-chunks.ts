import { createHash } from 'crypto';
import { Metafile } from 'esbuild';

export interface OutputSize {
  name: string;
  size: number;
  imports: string[];
}

export function importsInEntryPoint(entryPoint: string, metaFileOutputs: Metafile['outputs'], traversedImports = [entryPoint]): string[] {
  const staticImports = metaFileOutputs[entryPoint].imports.filter(
    ({ kind, path }) => kind !== 'dynamic-import' && !traversedImports.includes(path),
  );

  if (!staticImports.length) {
    return traversedImports;
  }

  return staticImports.flatMap(({ path }) => importsInEntryPoint(path, metaFileOutputs, [...traversedImports, path]));
}

export function mergedOutputs(outputPaths: string[], metaFileOutputs: Metafile['outputs']): Metafile['outputs'] {
  const metadata = structuredClone(metaFileOutputs);
  const outputsToMerge = outputPaths.map((path: string) => metaFileOutputs[path]);

  if (outputsToMerge.some(({ entryPoint }) => entryPoint)) {
    throw new Error(`Cannot merge outputs which are entry points. One for this is an entry point ${outputsToMerge}`);
  }

  const mergedOutput = outputsToMerge.reduce((previousValue, currentValue) => {
      return {
        ...previousValue,
        bytes: currentValue.bytes + previousValue.bytes,
        imports: [...currentValue.imports, ...previousValue.imports],
        inputs: {} // TODO
      }
  }, {
    bytes: 0,
    imports: [],
    inputs: {},
    exports: [],
    entryPoint: undefined,
    cssBundle: undefined,
  });
  return metadata;
}

function getEmptyBalancedOutputSizes(targetChunkCount: number) {
  return Array.from({ length: targetChunkCount }, (_, i) => ({ name: i.toString(), size: 0, imports: [] }));
}

function hashFromOutputPaths(paths: string[]): string {
  return createHash('sha256').update(paths.join('')).digest('hex').substring(0, 8).toUpperCase();
}

export const doesNotDependOnChunk = (currentOutput: OutputSize) => {
  return ({ imports }: OutputSize) => !imports.includes(currentOutput.name) && !currentOutput.imports.some(item => imports.includes(item));
}

const greedyBalanceOutputSize = (previousOutputs: OutputSize[], currentOutput: OutputSize): OutputSize[] => {
  const withoutImport = previousOutputs
    .filter(doesNotDependOnChunk(currentOutput))
  if (!withoutImport.length) {
    previousOutputs.push({ name: previousOutputs.length.toString(), size: 0, imports: [] })
  }
  // console.log(currentOutput.name, currentOutput.size, withoutImport.length);

  const smallestBinIndex = withoutImport
    .reduce<number>((prev, { size }, index, outputSizes) => {
      return size < outputSizes[prev].size ? index : prev;
    }, 0);

  return  previousOutputs.map((output, index) => {
    return index === smallestBinIndex
      ? {
        name: output.name,
        size: output.size + currentOutput.size,
        imports: [...(output.imports ?? []), currentOutput.name],
      }
      : output;
  });
};

export function balanceOutputSizes(targetChunkCount: number, sizedChunks: OutputSize[]): OutputSize[] {
  return sizedChunks
    .sort((a, b) => a.size - b.size)
    .reduce(greedyBalanceOutputSize, getEmptyBalancedOutputSizes(targetChunkCount))
    .filter(({ size }) => size !== 0)
    .map((output: OutputSize) => ({ ...output, name: hashFromOutputPaths(output.imports) }));
}

export function balanceMetaOutputs(targetChunkCount: number, entry: string, outputs: Metafile['outputs']): Record<string, string> {
  const imports = importsInEntryPoint(entry, outputs).filter((path) => path !== entry);
  const outputEntries = Object.entries(outputs);

  const initialOutputSizes = outputEntries
    .filter(([path]) => imports.includes(path))
    .map(([path, details]) => ({
      name: path,
      size: details.bytes,
      imports: details.imports.map(({ path }) => path),
    }));

  const balancedOutputs = balanceOutputSizes(targetChunkCount, initialOutputSizes);

  return balancedOutputs.reduce((previousValue, currentValue) => {
    const chunkMaps = currentValue.imports?.reduce((prev, curr) => {
      return { ...prev, [curr]: currentValue.name };
    }, {});
    return { ...previousValue, ...chunkMaps };
  }, {});
}
