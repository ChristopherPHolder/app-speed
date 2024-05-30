import { balanceOutputSizes, importsInEntryPoint } from './rollup-stats';
import { Metafile } from 'esbuild';

describe('importsInEntryPoint', () => {
  const outputs = {
    'main-X.js': {
      imports: [
        { kind: 'import-statement', path: 'chunk-A.js' },
        { kind: 'dynamic-import', path: 'chunk-B.js' },
      ],
    },
    'chunk-A.js': { imports: [{ kind: 'import-statement', path: 'chunk-B.js' }] },
    'chunk-B.js': { imports: [{ kind: 'dynamic-import', path: 'chunk-C.js' }] },
    'chunk-C.js': { imports: [{ kind: 'import-statement', path: 'chunk-C.js' }] },
  } as unknown as Metafile['outputs'];

  it('should return chunks imported in entry point', () => {
    expect(importsInEntryPoint('main-X.js', outputs)).toEqual(
      ['main-X.js', 'chunk-A.js', 'chunk-B.js']
    )
  });
});

describe('balanceOutputSizes', () => {

  const inputChunks = [
    { name: 'a', size: 1 },
    { name: 'b', size: 3 },
    { name: 'c', size: 7 },
    { name: 'd', size: 4 },
    { name: 'e', size: 1 },
    { name: 'f', size: 11 },
  ];

  it('should return new array of balanced output sizes', () => {
    expect(balanceOutputSizes(3, inputChunks)).toEqual([
        { name: '252F10C8', imports: ['f'], size: 11},
        { name: '69590970', imports: ["c", "a"], size: 8},
        { name: '7C088BD4', imports: ["d", "b", "e"], size: 8}
    ]);
  });
})
