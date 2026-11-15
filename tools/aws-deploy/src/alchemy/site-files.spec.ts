import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expandRules, hashFiles, listFiles, REVALIDATE } from './site-files';

const build = (files: Record<string, string>) => {
  const root = mkdtempSync(join(tmpdir(), 'site-files-'));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
};

const roots: string[] = [];
const site = (files: Record<string, string>) => {
  const root = build(files);
  roots.push(root);
  return root;
};
afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })));

describe('listFiles', () => {
  it('lists nested files as sorted POSIX paths, without directories', () => {
    const root = site({ 'index.html': '', 'assets/icons/logo.svg': '', 'main-ABC.js': '' });
    expect(listFiles(root)).toEqual(['assets/icons/logo.svg', 'index.html', 'main-ABC.js']);
  });

  it('reports a missing build as undefined, so a deploy cannot purge the site', () => {
    expect(listFiles(join(tmpdir(), 'no-such-build-output'))).toBeUndefined();
  });
});

describe('hashFiles', () => {
  it('changes when a file changes or moves, and only then', () => {
    const files = { 'index.html': 'v1', 'main-ABC.js': 'code' };
    const first = site(files);
    const same = site(files);
    const edited = site({ ...files, 'index.html': 'v2' });
    const renamed = site({ 'index.html': 'v1', 'main-DEF.js': 'code' });
    const hash = (root: string) => hashFiles(root, listFiles(root) ?? []);

    expect(hash(same)).toBe(hash(first));
    expect(hash(edited)).not.toBe(hash(first));
    expect(hash(renamed)).not.toBe(hash(first));
  });
});

describe('expandRules', () => {
  const files = [
    '3rdpartylicenses.txt',
    'assets/logo.svg',
    'docs/notes.txt',
    'favicon.ico',
    'index.html',
    'main-ABC.js',
  ];

  it('resolves globs to the exact files they match, at any depth', () => {
    expect(expandRules(files, [{ files: ['favicon.ico', 'assets/**', '**/*.txt'], cacheControl: REVALIDATE }])).toEqual(
      [
        {
          files: ['3rdpartylicenses.txt', 'assets/logo.svg', 'docs/notes.txt', 'favicon.ico'],
          cacheControl: REVALIDATE,
        },
      ],
    );
  });

  it('leaves out ignored files and rules that match nothing', () => {
    expect(
      expandRules(files, [
        { files: '**', ignore: '**/*.html', cacheControl: REVALIDATE },
        { files: '**/*.ttf', contentType: 'font/ttf', cacheControl: REVALIDATE },
      ]),
    ).toEqual([{ files: files.filter((file) => file !== 'index.html'), cacheControl: REVALIDATE }]);
  });
});
