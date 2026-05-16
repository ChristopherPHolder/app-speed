import { Effect, Schema } from 'effect';
import { describe, it, expect } from '@effect/vitest';
import { StepType } from '@puppeteer/replay';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from './lighthouse-userflow-step-type';

import {
  ReplayUserflowStepSchema,
  UserflowRunnerStepSchema,
  UserflowSnapshotStepSchema,
  UserflowStartNavigationStepSchema,
  UserflowStartTimespanStepSchema,
  UserflowStepSchema,
} from './lighthouse-userflow-step';

describe('UserflowRunnerStepSchema', () => {
  it.effect('should decode an explicit custom-step schema', () =>
    Effect.gen(function* () {
      const startNavigationStep = {
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        name: 'Home Page',
      };

      const decoded = yield* Schema.decodeUnknown(UserflowRunnerStepSchema)(startNavigationStep);

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
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        name: 'Home Page',
      };

      const decoded = yield* Schema.decodeUnknown(UserflowRunnerStepSchema)(input);

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
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
      };

      const decoded = yield* Schema.decodeUnknown(UserflowRunnerStepSchema)(input);

      expect(decoded).toEqual({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        parameters: undefined,
      });
    }),
  );

  it('rejects replay-shaped custom steps as input', () => {
    expect(
      Schema.is(UserflowStepSchema)({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
        parameters: { name: 'Snapshot step' },
      }),
    ).toBe(false);
  });

  it('validates each explicit schema', () => {
    expect(
      Schema.is(UserflowStartNavigationStepSchema)({
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
      }),
    ).toBe(true);
    expect(
      Schema.is(UserflowStartTimespanStepSchema)({
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
      }),
    ).toBe(true);
    expect(
      Schema.is(UserflowSnapshotStepSchema)({
        type: 'customStep',
        step: LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
      }),
    ).toBe(true);
  });

  it('exposes replay custom-step output separately from the schemas', () => {
    expect(
      Schema.is(ReplayUserflowStepSchema)({
        type: StepType.CustomStep,
        name: LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
        parameters: undefined,
      }),
    ).toBe(true);
  });
});
