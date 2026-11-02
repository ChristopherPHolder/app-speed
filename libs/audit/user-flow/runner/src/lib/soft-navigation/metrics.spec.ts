import type { TraceEvent } from 'lighthouse';
import { describe, expect, it } from 'vitest';
import { documentNavigationCount } from './metrics';

describe('document navigation detection', () => {
  it('counts main-frame document navigations without counting iframe loads or placeholder documents', () => {
    const navigation = (frame: string, documentLoaderURL: string, isLoadingMainFrame = true): TraceEvent => ({
      name: 'navigationStart',
      cat: 'loading',
      ph: 'R',
      ts: 1000,
      pid: 1,
      tid: 1,
      args: { frame, data: { documentLoaderURL, isLoadingMainFrame } },
    });
    expect(
      documentNavigationCount(
        [
          navigation('main', 'https://example.com'),
          navigation('main', 'https://example.com/product'),
          navigation('iframe', 'https://example.com/embed', false),
          navigation('main', 'about:blank'),
          navigation('main', ''),
        ],
        'main',
      ),
    ).toBe(2);
  });
});
