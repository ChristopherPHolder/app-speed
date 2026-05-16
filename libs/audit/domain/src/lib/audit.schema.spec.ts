import { Schema } from 'effect';
import { describe } from 'vitest';
import { it } from '@effect/vitest';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';
import { AuditAuthoringSchema, PuppeteerReplayUserflowRunnerSchema } from './audit.schema';

describe('ReplayRunnerSchema', () => {
  it('should decode to replay schema', () => {
    const recording = {
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          name: 'Home Page',
        },
      ],
    };
    const decoded = Schema.decodeUnknownSync(PuppeteerReplayUserflowRunnerSchema)(recording);
    expect(decoded).toEqual({
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          parameters: { name: 'Home Page' },
        },
      ],
    });
  });
});

describe('AuditAuthoringSchema', () => {
  it('should accept valid audit', async () => {
    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'customStep',
            step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
          },
        ],
      }),
    ).toBe(true);
  });

  it('should reject replay-shaped custom step input', () => {
    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'customStep',
            name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
            parameters: { name: 'Home Page' },
          },
        ],
      }),
    ).toBe(false);
  });

  it('should reject empty object', () => {
    expect(Schema.is(AuditAuthoringSchema)({})).toBe(false);
  });

  it('should reject missing device', () => {
    expect(Schema.is(AuditAuthoringSchema)({ title: '' })).toBe(false);
  });

  it('should reject missing title', () => {
    expect(Schema.is(AuditAuthoringSchema)({ device: '' })).toBe(false);
  });

  it('should reject invalid timeout', () => {
    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        timeout: -1,
      }),
    ).toBe(false);

    // TODO invalidate over 30_000
  });

  it('should reject no steps', () => {
    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
      }),
    ).toBe(false);

    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [],
      }),
    ).toBe(false);
  });

  it('should reject if no audit step in steps', () => {
    expect(
      Schema.is(AuditAuthoringSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'navigate',
            url: 'https://www.google.com',
          },
        ],
      }),
    ).toBe(false);
  });
});
