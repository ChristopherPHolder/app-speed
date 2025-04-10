import { describe, expect } from 'vitest';
import { AuditStepsSchema, isAuditStepSchema } from './audit-steps.schema';
import { ParseResult, Schema } from 'effect';

describe('AuditStepSchema', () => {
  it.only('should reject invalid step in array', () => {
    const auditSteps = [
      { type: 'startNavigation' },
      { type: 'navigate', url: 'https://appspeed.dev' },
      { type: 'WOLOLO' },
    ];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);

    const result = decode(auditSteps);
    // const error = Either.isLeft(decoded);
    // const success = Either.right(decoded);
    expect(ParseResult.TreeFormatter.formatErrorSync(result.left)).toEqual(false);
    // expect(success).toEqual(false);
    // expect(isAuditStepSchema([{ type: 'invalid stub' }])).toEqual(false);
  });

  it('should reject if steps does not have navigation step', () => {
    const auditSteps = [{ type: 'snapshot' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);
    expect(decodeAuditSteps(auditSteps)).toThrowErrorMatchingSnapshot();
  });

  it('should reject if snapshot step is before navigation', () => {
    const auditSteps = [{ type: 'snapshot' }, { type: 'navigate', url: 'https://appspeed.dev' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);
    expect(decodeAuditSteps(auditSteps)).toThrowErrorMatchingSnapshot();
  });

  it('should reject if no user-flow step in audit', () => {
    const auditSteps = [{ type: 'navigate', url: 'https://appspeed.dev' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);
    expect(decodeAuditSteps(auditSteps)).toThrowErrorMatchingSnapshot();
  });

  it.todo('should reject if userflow start step does not contain end step', () => {
    const auditSteps = [
      { type: 'startNavigation', name: 'ss' },
      { type: 'navigate', url: 'https://appspeed.dev' },
    ];
    expect(isAuditStepSchema(auditSteps)).toEqual(false);
    expect(decodeAuditSteps(auditSteps)).toThrowErrorMatchingSnapshot();
  });

  it('should accept valid steps', () => {
    const auditSteps = [{ type: 'navigate', url: 'https://appspeed.dev' }, { type: 'snapshot' }];
    expect(isAuditStepSchema(auditSteps)).toEqual(true);
    expect(decodeAuditSteps(auditSteps)).not.toThrow();
  });

  const decodeAuditSteps = (steps: unknown) => () =>
    Schema.decodeUnknownSync(AuditStepsSchema, { errors: 'all' })(steps);
  const decode = Schema.decodeUnknownEither(AuditStepsSchema);
});
