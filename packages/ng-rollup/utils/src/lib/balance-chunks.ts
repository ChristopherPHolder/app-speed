import { Metafile } from 'esbuild';
import { createHash } from 'crypto';

interface OutputSize {
  name: string;
  size: number;
  imports: string[];
}

function importsInEntryPoint(entryPoint: string, metaFileOutputs: Metafile['outputs'], traversedImports = [entryPoint]): string[] {
  const staticImports = metaFileOutputs[entryPoint].imports
    .filter(({ kind, path }) => kind !== 'dynamic-import' && !traversedImports.includes(path));

  if (!staticImports.length) {
    return traversedImports;
  }

  return staticImports.flatMap(({ path }) => importsInEntryPoint(path, metaFileOutputs, [...traversedImports, path]));
}

function getEmptyBalancedOutputSizes(targetChunkCount: number) {
  return Array.from({ length: targetChunkCount }, (_, i) => ({ name: i.toString(), size: 0, imports: [] }));
}

function hashFromOutputPaths(paths: string[]): string {
  return createHash('sha256').update(paths.join('')).digest('hex').substring(0, 8).toUpperCase();
}

const greedyBalanceOutputSize = (previousOutputs: OutputSize[], currentOutput: OutputSize): OutputSize[] => {
  const smallestBinIndex = previousOutputs.reduce<number>((prev, { size }, index, outputSizes) => {
    return size < outputSizes[prev].size ? index : prev;
  }, 0);

  return previousOutputs.map((output, index) => {
    return index === smallestBinIndex ? {
        name: output.name,
        size: output.size + currentOutput.size,
        imports: [...(output.imports ?? []), currentOutput.name],
      }
      : output;
  });
};

function balanceOutputSizes(targetChunkCount: number, sizedChunks: OutputSize[]): OutputSize[] {
  return sizedChunks
    .sort((a, b) => b.size - a.size)
    .reduce(greedyBalanceOutputSize, getEmptyBalancedOutputSizes(targetChunkCount))
    .filter(({ size }) => size !== 0)
    .map((output: OutputSize) => ({ ...output, name: hashFromOutputPaths(output.imports) }));
}

export function balanceMetaOutputs(targetChunkCount: number, entry: string, outputs: Metafile['outputs']): Record<string, string> {
  const imports = importsInEntryPoint(entry, outputs);
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
