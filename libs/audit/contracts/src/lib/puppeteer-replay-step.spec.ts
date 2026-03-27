import { describe, expect } from 'vitest';
import { Schema } from 'effect';
import { NavigateStepSchema, WaitForExpressionStepSchema } from './puppeteer-replay-step';

describe('PuppeteerReplayStepSchema', () => {
  it('should validate NavigateStepSchema', () => {
    expect(
      Schema.is(NavigateStepSchema)({
        type: 'navigate',
        url: 'https://www.google.com',
      }),
    ).toEqual(true);
  });

  it('should decode string timeouts as numbers for waitForExpression', () => {
    const decoded = Schema.decodeUnknownSync(WaitForExpressionStepSchema)({
      type: 'waitForExpression',
      expression: 'window.__ready === true',
      timeout: '5000',
    });

    expect(decoded).toMatchObject({
      type: 'waitForExpression',
      expression: 'window.__ready === true',
      timeout: 5000,
    });
  });
});
