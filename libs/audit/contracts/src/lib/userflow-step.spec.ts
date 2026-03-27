import { Effect, Schema } from 'effect';
import { describe, it, expect } from '@effect/vitest';
import { StepType } from '@puppeteer/replay';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/model';

import { UserflowAuditStepSchema } from './userflow-step';

describe('UserflowAuditStepSchema', () => {
  it.effect('should decode UserflowAuditStep', () =>
    Effect.gen(function* () {
      const startNavigationStep = {
        type: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        name: 'Home Page',
      };

      const decoded = yield* Schema.decodeUnknown(UserflowAuditStepSchema)(startNavigationStep);

      expect(decoded).toEqual({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        parameters: { name: 'Home Page' },
      });
    }),
  );

  it.effect('decodes lighthouse steps with flags into replay steps', () =>
    Effect.gen(function* () {
      const input = {
        type: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        name: 'Home Page',
      };

      const decoded = yield* Schema.decodeUnknown(UserflowAuditStepSchema)(input);

      expect(decoded).toEqual({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        parameters: { name: 'Home Page' },
      });
    }),
  );

  it.effect('decodes lighthouse steps without flags into replay steps', () =>
    Effect.gen(function* () {
      const input = {
        type: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
      };

      const decoded = yield* Schema.decodeUnknown(UserflowAuditStepSchema)(input);

      expect(decoded).toEqual({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        parameters: undefined,
      });
    }),
  );

  it.effect('accepts replay custom steps as-is', () =>
    Effect.gen(function* () {
      const input = {
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
        parameters: { name: 'Snapshot step' },
      };

      const decoded = yield* Schema.decodeUnknown(UserflowAuditStepSchema)(input);

      expect(decoded).toEqual(input);
    }),
  );
});
