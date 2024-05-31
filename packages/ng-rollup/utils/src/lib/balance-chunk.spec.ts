import { describe, it, expect } from 'vitest';
import { Metafile } from 'esbuild';
import { balanceMetaOutputs } from './balance-chunks';


describe('balanceMetaOutputs', () => {
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
