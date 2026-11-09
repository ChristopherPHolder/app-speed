import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export function registerVisualSnapshots(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  const root = resolve(config.projectRoot, '../..');
  on('after:run', () => {
    const images: string[] = [];
    const directory = resolve(root, 'artifacts/workspace-visuals');
    for (const viewport of ['desktop', 'mobile']) {
      const folder = resolve(directory, 'actual', viewport);
      if (existsSync(folder))
        for (const file of readdirSync(folder)
          .filter((name) => name.endsWith('.png'))
          .sort()) {
          images.push(
            `<section><h2>${viewport}: ${file}</h2><img style="max-width:100%" src="actual/${viewport}/${file}" /></section>`,
          );
        }
    }
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      resolve(directory, 'index.html'),
      `<!doctype html><html><head><meta charset="utf-8"><title>Workspace journeys</title></head><body><h1>Workspace journey screenshots</h1>${images.join('')}</body></html>`,
    );
  });
  on('after:screenshot', (details) => {
    if (!details.name?.startsWith('workspace/')) return;
    const name = details.name.slice('workspace/'.length);
    compareVisualSnapshot(root, name, details.path, process.env['UPDATE_VISUAL_SNAPSHOTS'] === 'true');
  });
}

export function compareVisualSnapshot(
  root: string,
  name: string,
  screenshotPath: string,
  update = false,
  platform: NodeJS.Platform = process.platform,
): void {
  if (!/^(desktop|mobile)\/[a-z0-9-]+$/.test(name)) throw new Error('Invalid visual snapshot name');
  const baseline = resolve(root, 'docs/screenshots/workspace-journeys/baselines', platform, `${name}.png`);
  const actual = resolve(root, 'artifacts/workspace-visuals/actual', `${name}.png`);
  const diffPath = resolve(root, 'artifacts/workspace-visuals/diff', `${name}.png`);
  mkdirSync(dirname(actual), { recursive: true });
  copyFileSync(screenshotPath, actual);
  if (update) {
    mkdirSync(dirname(baseline), { recursive: true });
    copyFileSync(actual, baseline);
    return;
  }
  if (!existsSync(baseline))
    throw new Error(
      `Missing ${platform} visual baseline ${name}. Run the explicit update-snapshots configuration and review the result.`,
    );
  const expected = PNG.sync.read(readFileSync(baseline));
  const received = PNG.sync.read(readFileSync(actual));
  if (received.width !== expected.width || received.height !== expected.height) {
    throw new Error(
      `Visual snapshot dimensions changed: ${name} (${expected.width}×${expected.height} → ${received.width}×${received.height})`,
    );
  }
  const diff = new PNG({ width: received.width, height: received.height });
  const pixels = pixelmatch(expected.data, received.data, diff.data, received.width, received.height, {
    threshold: 0.1,
  });
  // Ignore anti-aliasing and allow 0.5% pixel variance; layout and color regressions still fail.
  if (pixels / (received.width * received.height) > 0.005) {
    mkdirSync(dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, PNG.sync.write(diff));
    throw new Error(`Visual snapshot changed: ${name}: ${pixels} pixels differ. See ${diffPath}`);
  }
}
