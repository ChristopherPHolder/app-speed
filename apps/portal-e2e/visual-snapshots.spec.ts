import { afterEach, beforeEach, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { compareVisualSnapshot } from './visual-snapshots';

let root: string;
let capture: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'workspace-visual-test-'));
  capture = join(root, 'capture.png');
  const image = new PNG({ width: 24, height: 24 });
  image.data.fill(255);
  writeFileSync(capture, PNG.sync.write(image));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));
it('fails on an unreviewed baseline instead of silently accepting it', () => {
  expect(() => compareVisualSnapshot(root, 'desktop/screen', capture)).toThrow('Missing visual baseline');
});
it('accepts an identical image but fails a color regression and writes a diff', () => {
  compareVisualSnapshot(root, 'desktop/screen', capture, true);
  expect(() => compareVisualSnapshot(root, 'desktop/screen', capture)).not.toThrow();
  const image = new PNG({ width: 24, height: 24 });
  image.data.fill(0);
  writeFileSync(capture, PNG.sync.write(image));
  expect(() => compareVisualSnapshot(root, 'desktop/screen', capture)).toThrow('Visual snapshot changed');
  expect(existsSync(join(root, 'artifacts/workspace-visuals/diff/desktop/screen.png'))).toBe(true);
});
it('fails a layout-size regression', () => {
  compareVisualSnapshot(root, 'mobile/screen', capture, true);
  writeFileSync(capture, PNG.sync.write(new PNG({ width: 25, height: 24 })));
  expect(() => compareVisualSnapshot(root, 'mobile/screen', capture)).toThrow('dimensions changed');
});
it('rejects snapshot names outside the gallery', () => {
  expect(() => compareVisualSnapshot(root, '../screen', capture, true)).toThrow('Invalid visual snapshot name');
});
