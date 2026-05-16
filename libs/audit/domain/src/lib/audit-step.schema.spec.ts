import { describe, it, expect } from 'vitest';
import { Schema, Either, ParseResult } from 'effect';
import { AuditStepSchema, AuditStepTypeSchema, isAuditStep, isStepType } from './audit-step.schema';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';
import { PUPPETEER_REPLAY_CUSTOM_STEP_TYPE } from './puppeteer-replay/puppeteer-replay-step-type';

describe('AuditStep', () => {
  it('should reject with readable message invalid step type', () => {
    expect(isStepType('')).toEqual(false);
    expect(isStepType('INVALID_TYPE_STUB')).toEqual(false);
    expect(decodingErrorMessage(AuditStepTypeSchema, '')).toContain('Invalid audit step type');
    expect(decodingErrorMessage(AuditStepTypeSchema, 'INVALID_TYPE_STUB')).toContain('Invalid audit step type');
  });

  it('should accept replay customStep as a valid step type', () => {
    expect(isStepType(PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP)).toEqual(true);
  });

  it.for(Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE))('should reject custom step identities as top-level step types: %s', (type) => {
    expect(isStepType(type)).toEqual(false);
  });

  it('should accept custom steps when they include an explicit step discriminant', () => {
    expect(
      isAuditStep({
        type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP,
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      }),
    ).toEqual(true);
  });

  it('should reject custom steps without a custom step identity', () => {
    expect(isAuditStep({ type: PUPPETEER_REPLAY_CUSTOM_STEP_TYPE.CUSTOM_STEP })).toEqual(false);
  });

  it.for(['navigate', 'waitForElement'])('should accept valid non-custom step type %s', (type) => {
    expect(isStepType(type)).toEqual(true);
  });

  it('should reject with readable message steps with invalid', () => {
    expect(isAuditStep({ type: 'INVALID_TYPE_STUB' })).toEqual(false);
    expect(decodingErrorMessage(AuditStepSchema, { type: 'INVALID_TYPE_STUB' })).toContain('INVALID_TYPE_STUB');
  });

  function decodingErrorMessage(schema: Schema.Schema<unknown>, input: unknown) {
    const result = Schema.decodeUnknownEither(schema)(input);
    if (Either.isLeft(result)) {
      return ParseResult.TreeFormatter.formatErrorSync(result.left);
    }
    return undefined;
  }
});
