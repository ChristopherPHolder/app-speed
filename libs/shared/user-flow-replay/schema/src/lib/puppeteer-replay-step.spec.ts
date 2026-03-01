import { describe, expect } from 'vitest';
import { Schema } from 'effect';
import { NavigateStepSchema } from './puppeteer-replay-step';

describe('PuppeteerReplayStepSchema', () => {
  it('should validate NavigateStepSchema', () => {
    expect(
      Schema.is(NavigateStepSchema)({
        type: 'navigate',
        url: 'https://www.google.com',
      }),
    ).toEqual(true);
  });
});
