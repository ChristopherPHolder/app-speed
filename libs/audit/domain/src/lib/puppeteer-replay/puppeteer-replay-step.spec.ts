import { describe, expect } from 'vitest';
import { Schema } from 'effect';
import { ChangeStepSchema, NavigateStepSchema, WaitForExpressionStepSchema } from './puppeteer-replay-step';

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

  it('accepts normalized selector paths in authoring schemas', () => {
    expect(
      Schema.is(ChangeStepSchema)({
        type: 'change',
        value: 'updated',
        selectors: [{ segments: ['aria/Name'] }, { segments: ['form', '#name'] }],
      }),
    ).toBe(true);
  });

  it('rejects legacy replay selector arrays in authoring schemas', () => {
    expect(
      Schema.is(ChangeStepSchema)({
        type: 'change',
        value: 'updated',
        selectors: [['aria/Name'], ['form', '#name']],
      }),
    ).toBe(false);
  });
});
