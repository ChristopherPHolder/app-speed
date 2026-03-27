import { describe, it, expect } from 'vitest';
import { isStepType, AuditStepTypeSchema, isAuditStep, AuditStepSchema } from './audit-step.schema';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/model';
import { Schema, Either, ParseResult } from 'effect';

describe('AuditStep', () => {
  it('should reject with readable message invalid step type', () => {
    expect(isStepType('')).toEqual(false);
    expect(isStepType('INVALID_TYPE_STUB')).toEqual(false);
    expect(decodingErrorMessage(AuditStepTypeSchema, '')).toContain('Invalid audit step type');
    expect(decodingErrorMessage(AuditStepTypeSchema, 'INVALID_TYPE_STUB')).toContain('Invalid audit step type');
  });

  it.for(Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE))('should accept valid step type %s', (type) => {
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
