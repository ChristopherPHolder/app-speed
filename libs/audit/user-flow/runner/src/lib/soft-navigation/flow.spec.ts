import { describe, expect, it } from 'vitest';
import { navigationPlan } from './flow';

describe('navigation planning', () => {
  it('keeps explicit URL navigation native and enables the experiment for an interaction without a toggle', () => {
    expect(
      navigationPlan({
        title: 'Journey',
        device: 'desktop',
        steps: [
          { type: 'customStep', name: 'startNavigation' },
          { type: 'navigate', url: 'https://example.com' },
          { type: 'customStep', name: 'endNavigation' },
          { type: 'customStep', name: 'startNavigation' },
          { type: 'click', offsetX: 1, offsetY: 1, selectors: [['#product']] },
          { type: 'customStep', name: 'endNavigation' },
        ],
      }),
    ).toEqual(['navigation', 'soft-navigation']);
  });
});
