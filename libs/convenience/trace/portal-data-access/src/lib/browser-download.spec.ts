import { assert, it } from '@effect/vitest';
import { Effect } from 'effect';
import { downloadBrowserArtifact, safeTraceBaseName, traceArtifactName } from './browser-download';

it('creates safe shared artifact names', () => {
  expect(safeTraceBaseName(' Checkout / trace.json ')).toBe('Checkout-trace');
  expect(safeTraceBaseName('!!!.trace')).toBe('trace');
  expect(traceArtifactName('Checkout trace.json', 'screenshots', 'zip')).toBe('Checkout-trace-screenshots.zip');
  expect(traceArtifactName('Checkout trace.json', 'filmstrip', 'png')).toBe('Checkout-trace-filmstrip.png');
});

it.effect('downloads an artifact and always releases its object URL', () =>
  Effect.gen(function* () {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const remove = vi.spyOn(anchor, 'remove');
    const append = vi.spyOn(document.body, 'append');
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectURL = vi.fn(() => 'blob:artifact');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    yield* downloadBrowserArtifact({ blob: new Blob(['artifact']), downloadName: 'artifact.zip' });

    assert.strictEqual(anchor.download, 'artifact.zip');
    assert.strictEqual(click.mock.calls.length, 1);
    assert.strictEqual(remove.mock.calls.length, 1);
    assert.strictEqual(append.mock.calls.length, 1);
    assert.strictEqual(createObjectURL.mock.calls.length, 1);
    assert.deepStrictEqual(revokeObjectURL.mock.calls, [['blob:artifact']]);
    createElement.mockRestore();
    append.mockRestore();
    remove.mockRestore();
    click.mockRestore();
  }),
);

it.effect('removes the anchor and revokes the URL when clicking fails', () =>
  Effect.gen(function* () {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {
      throw new Error('click failed');
    });
    const remove = vi.spyOn(anchor, 'remove');
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:failed' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

    const error = yield* Effect.flip(
      downloadBrowserArtifact({ blob: new Blob(['artifact']), downloadName: 'artifact.zip' }),
    );

    assert.strictEqual(error._tag, 'BrowserDownloadError');
    assert.strictEqual(remove.mock.calls.length, 1);
    assert.deepStrictEqual(revokeObjectURL.mock.calls, [['blob:failed']]);
    createElement.mockRestore();
    remove.mockRestore();
    click.mockRestore();
  }),
);
