import { ImportKind, Metafile } from 'esbuild';
import { createHash } from 'crypto'

type ReadonlyDeep<T> = T extends (...args: ReadonlyArray<never>) => never
  ? T
  : T extends never[]
    ? ReadonlyArray<ReadonlyDeep<T[number]>>
    : T extends object
      ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
      : T;

type MetafileOutputs = ReadonlyDeep<Metafile['outputs']>;

type OutputImport = {
  readonly path: string;
  readonly kind: ImportKind | 'file-loader';
  readonly external?: boolean | undefined;
};

const isNotImportKind = (excludedKind: ImportKind) => ({kind}: OutputImport): boolean => kind !== excludedKind;
const isNotDynamicImport = isNotImportKind("dynamic-import");
const importNotTraversed = (traversedImports: ReadonlyArray<string>) => ({path}: OutputImport): boolean => !traversedImports.includes(path);
const importsInSubEntryPoint = (metaFileOutputs: MetafileOutputs, traversedImports: ReadonlyArray<string>) => (path: string) => importsInEntryPoint(path, metaFileOutputs, traversedImports.concat(path));

export function importsInEntryPoint(entryPoint: string, metaFileOutputs: MetafileOutputs, traversedImports: ReadonlyArray<string> = [entryPoint]): ReadonlyArray<string> {
  const staticImports = metaFileOutputs[entryPoint].imports.filter(isNotDynamicImport).filter(importNotTraversed(traversedImports)).map(({path}) => path);
  return staticImports.length ? staticImports.flatMap(importsInSubEntryPoint(metaFileOutputs, traversedImports)) : traversedImports;
}

interface OutputSize {
  readonly name: string;
  readonly size: number;
  readonly imports?: ReadonlyArray<string>;
}

const comparedBySize = (a: OutputSize, b: OutputSize) => b.size - a.size;
const outputSizeMapFn = (name: string, size: number, imports: ReadonlyArray<string>): OutputSize => ({ name, size, imports })
const emptyBalancedOutputSizes = (targetChunkCount: number): OutputSize[] => Array.from({ length: targetChunkCount }, (_, i) => outputSizeMapFn(i.toString(), 0, []));
const indexOfSmallestOutput = (prev: number, curr: OutputSize, index: number, array: ReadonlyArray<OutputSize>): number => curr.size < array[prev].size ? index : prev;

const hashFromOutputPaths = (paths: ReadonlyArray<string>) => createHash('sha256').update(paths.join('')).digest('hex').substring(0, 8).toUpperCase();

const greedyBalanceOutputSize = (previousOutputs: ReadonlyArray<OutputSize>, currentOutput: OutputSize): OutputSize[] => {
  const smallestBinIndex = previousOutputs.reduce<number>(indexOfSmallestOutput, 0);
  return previousOutputs.map((output, index) => {
    return index === smallestBinIndex
      ? { name: output.name, size: output.size + currentOutput.size, imports: [...output.imports ?? [], currentOutput.name] }
      : output
  })
}

export function balanceOutputSizes(targetChunkCount: number, sizedChunks: ReadonlyArray<OutputSize>): OutputSize[] {
  return sizedChunks
    .toSorted(comparedBySize)
    .reduce(greedyBalanceOutputSize, emptyBalancedOutputSizes(targetChunkCount))
    .filter(({size}) => size !== 0)
    .map((output: OutputSize) => ({ ...output, name: hashFromOutputPaths(output.imports!) }));
}

export function balanceMetaOutputs(targetChunkCount: number, entry: string, outputs: MetafileOutputs): Readonly<Record<string, string>> {
  const imports = importsInEntryPoint(entry, outputs);
  const outputEntries = Object.entries(outputs);

  const initialOutputSizes = outputEntries.filter(([path]) => imports.includes(path)).map(([path, details]) => outputSizeMapFn(path, details.bytes, details.imports.map(({path}) => path)));

  const balancedOutputs = balanceOutputSizes(targetChunkCount, initialOutputSizes);

  return balancedOutputs.reduce((previousValue, currentValue) => {
    const chunkMaps = currentValue.imports?.reduce((prev, curr) => {
      return { ...prev, [curr]: currentValue.name }
    }, {}) ;
    return  { ...previousValue, ...chunkMaps };
  }, {});
}
