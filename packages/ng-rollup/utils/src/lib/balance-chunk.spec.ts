import { describe, expect, it } from 'vitest';
import { Metafile } from 'esbuild';
import { balanceMetaOutputs, balanceOutputSizes, importsInEntryPoint } from './balance-chunks';
import { reduceOutputMock } from './stats.mock';

describe('importsInEntryPoint', () => {

  it('should return a list all non dynamic imports of an entry point', () => {
    const metaFileOutputs = {
      'entry.js': {
        imports: [{ path: 'a.js', kind: 'import-statement' }, { path: 'b.js', kind: 'dynamic-import' }],
      },
      'a.js': {
        imports: [{ path: 'c.js', kind: 'import-statement' }],
      },
      'b.js': {
        imports: [{ path: 'c.js', kind: 'import-statement' }],
      },
      'c.js': {
        imports: [],
      },
    } as unknown as Metafile['outputs'];

    expect(importsInEntryPoint('entry.js', metaFileOutputs)).toEqual(
      expect.arrayContaining(['entry.js', 'a.js', 'c.js'])
    );

    expect(importsInEntryPoint('b.js', metaFileOutputs)).toEqual(
      expect.arrayContaining(['b.js', 'c.js'])
    );

    expect(importsInEntryPoint('c.js', metaFileOutputs)).toEqual(
        expect.arrayContaining(['c.js'])
    );
  });
});

describe('balanceOutputSizes', () => {

  it('should not create a circular dependency', () => {
    const entry = 'main-PEGS2APP.js'
    const outputs = reduceOutputMock as unknown as Metafile['outputs'];

    const imports = importsInEntryPoint(entry, outputs).filter((path) => path !== entry);
    const outputEntries = Object.entries(outputs);

    const initialOutputSizes = outputEntries
      .filter(([path]) => imports.includes(path))
      .map(([path, details]) => ({
        name: path,
        size: details.bytes,
        imports: details.imports.map(({ path }) => path),
      }));

    const balancedOutputs = balanceOutputSizes(2, initialOutputSizes);

    const hasCircularDeps = balancedOutputs.some((balanceOutput, index, array) => {
      const remaining = [...array.slice(0, index), ...array.slice(index + 1)].flatMap(({imports}) => imports.flatMap((imp ) => importsInEntryPoint(imp, outputs)));
      const deepImports = balanceOutput.imports.flatMap((imp ) => importsInEntryPoint(imp, outputs));
      return deepImports.some((imp) => remaining.includes(imp));
    });

    expect(hasCircularDeps).toBeFalsy();

    /**
     *     { 'a': [], 'b': ['a'], 'c': ['b'] }
     *
     *     { '1': [], '2': [] }
     *
     *     { '1': ['a'], '2': [] }
     *F
     *     { '1': ['a'], '2': ['b'] }
     *
     *     { '1': ['a', 'c'], '2': ['b'] }
     */
  });

  it('should not create a circular dependency', () => {
    const entry = 'entry.js'
    const outputs = {
      'entry.js': {
        bytes: 1,
        imports: [
          { path: 'a.js', kind: 'import-statement' },
          { path: 'b.js', kind: 'import-statement' },
          { path: 'c.js', kind: 'import-statement' },
        ],
      },
      'a.js': {
        bytes: 1,
        imports: []
      },
      'b.js': {
        bytes: 1,
        imports: [{ path: 'a.js', kind: 'import-statement' }],
      },
      'c.js': {
        bytes: 1,
        imports: [{ path: 'b.js', kind: 'import-statement' }]
      },
    } as unknown as Metafile['outputs'];

    const imports = importsInEntryPoint(entry, outputs).filter((path) => path !== entry);
    const outputEntries = Object.entries(outputs);

    const initialOutputSizes = outputEntries
      .filter(([path]) => imports.includes(path))
      .map(([path, details]) => ({
        name: path,
        size: details.bytes,
        imports: details.imports.map(({ path }) => path),
      }));

    const balancedOutputs = balanceOutputSizes(2, initialOutputSizes);

    const hasCircularDeps = balancedOutputs.some((balanceOutput, index, array) => {
      const remaining = [...array.slice(0, index), ...array.slice(index + 1)]
      .flatMap(({imports}) => imports.flatMap((imp ) => importsInEntryPoint(imp, outputs)));
      const deepImports = balanceOutput.imports.flatMap((imp ) => importsInEntryPoint(imp, outputs));
      return deepImports.some((imp) => remaining.includes(imp));
    });

    expect(hasCircularDeps).toBeFalsy();

    /**
     *     { 'a': [], 'b': ['a'], 'c': ['b'] }
     *
     *     { '1': [], '2': [] }
     *
     *     { '1': ['a'], '2': [] }
     *F
     *     { '1': ['a'], '2': ['b'] }
     *
     *     { '1': ['a', 'c'], '2': ['b'] }
     */
  });
})

describe.skip('balanceMetaOutputs', () => {
  const metaFileOutputs = {
    'entry.js': {
      imports: [{ path: 'a.js', kind: 'import-statement' }, { path: 'b.js', kind: 'dynamic-import' }],
      bytes: 1000
    },
    'a.js': {
      imports: [{ path: 'c.js', kind: 'import-statement' }],
      bytes: 500
    },
    'b.js': {
      imports: [],
      bytes: 500
    },
    'c.js': {
      imports: [],
      bytes: 300
    }
  } as unknown as Metafile['outputs'];

  it('should balance meta outputs correctly', () => {
    const targetChunkCount = 3;
    const result = balanceMetaOutputs(targetChunkCount, 'entry.js', metaFileOutputs);
    expect(result).toEqual(expect.any(Object));
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['a.js', 'c.js']));
  });
});
