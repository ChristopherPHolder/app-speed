import { Schema } from 'effect';
import { describe } from 'vitest';
import { it } from '@effect/vitest';
import { AUDIT_CUSTOM_STEP_TYPE } from './custom-audit-step-type';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow/lighthouse-userflow-step-type';
import { AuditSchema, PuppeteerReplayUserflowRunnerSchema } from './audit.schema';

describe('PuppeteerReplayUserflowRunnerSchema', () => {
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

  it('should decode clearCache custom steps into parameterless replay custom steps', () => {
    const recording = {
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
        },
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
          name: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
          parameters: undefined,
        },
        {
          type: 'customStep',
          name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          parameters: { name: 'Home Page' },
        },
      ],
    });
  });

  it('should decode addCookie custom steps into replay parameters', () => {
    const recording = {
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
          name: 'session',
          value: 'token',
          url: 'https://example.com/app',
          domain: '.example.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'Strict',
        },
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
          name: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
          parameters: {
            name: 'session',
            value: 'token',
            url: 'https://example.com/app',
            domain: '.example.com',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'Strict',
          },
        },
        {
          type: 'customStep',
          name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          parameters: { name: 'Home Page' },
        },
      ],
    });
  });

  it('should decode sleep custom steps into replay parameters', () => {
    const recording = {
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: AUDIT_CUSTOM_STEP_TYPE.SLEEP,
          seconds: 5,
        },
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
          name: AUDIT_CUSTOM_STEP_TYPE.SLEEP,
          parameters: {
            seconds: 5,
          },
        },
        {
          type: 'customStep',
          name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          parameters: { name: 'Home Page' },
        },
      ],
    });
  });

  it('should decode normalized selector paths into replay-compatible selectors', () => {
    const recording = {
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
          name: 'Home Page',
        },
        {
          type: 'click',
          selectors: [{ segments: ['aria/Proceed to checkout'] }, { segments: ['main', '[data-test=checkout]'] }],
          offsetX: 0,
          offsetY: 0,
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
        {
          type: 'click',
          selectors: ['aria/Proceed to checkout', ['main', '[data-test=checkout]']],
          offsetX: 0,
          offsetY: 0,
        },
      ],
    });
  });
});

describe('AuditSchema', () => {
  it('should accept valid audit', async () => {
    expect(
      Schema.is(AuditSchema)({
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

  it('should accept clearCache persisted custom steps', () => {
    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'customStep',
            step: AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE,
          },
          {
            type: 'customStep',
            step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
          },
        ],
      }),
    ).toBe(true);
  });

  it('should accept addCookie persisted custom steps', () => {
    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'customStep',
            step: AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE,
            name: 'session',
            value: 'token',
            url: 'https://example.com/app',
            sameSite: 'Lax',
          },
          {
            type: 'customStep',
            step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
          },
        ],
      }),
    ).toBe(true);
  });

  it('should accept sleep persisted custom steps within one to sixty seconds', () => {
    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'customStep',
            step: AUDIT_CUSTOM_STEP_TYPE.SLEEP,
            seconds: 60,
          },
          {
            type: 'customStep',
            step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
          },
        ],
      }),
    ).toBe(true);
  });

  it('should reject sleep persisted custom steps outside one to sixty seconds', () => {
    const createAudit = (seconds: number) => ({
      title: 'Stub audit title',
      device: 'mobile',
      steps: [
        {
          type: 'customStep',
          step: AUDIT_CUSTOM_STEP_TYPE.SLEEP,
          seconds,
        },
        {
          type: 'customStep',
          step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        },
      ],
    });

    expect(Schema.is(AuditSchema)(createAudit(0))).toBe(false);
    expect(Schema.is(AuditSchema)(createAudit(61))).toBe(false);
    expect(Schema.is(AuditSchema)(createAudit(1.5))).toBe(false);
  });

  it('should reject replay-shaped custom step input', () => {
    expect(
      Schema.is(AuditSchema)({
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
    expect(Schema.is(AuditSchema)({})).toBe(false);
  });

  it('should reject missing device', () => {
    expect(Schema.is(AuditSchema)({ title: '' })).toBe(false);
  });

  it('should reject missing title', () => {
    expect(Schema.is(AuditSchema)({ device: '' })).toBe(false);
  });

  it('should reject invalid timeout', () => {
    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        timeout: -1,
      }),
    ).toBe(false);

    // TODO invalidate over 30_000
  });

  it('should reject no steps', () => {
    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
      }),
    ).toBe(false);

    expect(
      Schema.is(AuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [],
      }),
    ).toBe(false);
  });

  it('should reject if no audit step in steps', () => {
    expect(
      Schema.is(AuditSchema)({
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
