import { describe, expect, it } from 'vitest';
import { AUDIT_CUSTOM_STEP_TYPE, LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { STEP_SELECTION_OPTIONS_GROUPED } from './step-property.model';

describe('STEP_SELECTION_OPTIONS_GROUPED', () => {
  it('groups audit and custom steps separately in the selector', () => {
    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Audit Steps',
      icon: 'lighthouse-badge',
      options: [
        LIGHTHOUSE_AUDIT_STEP_TYPE.START_NAVIGATION,
        LIGHTHOUSE_AUDIT_STEP_TYPE.END_NAVIGATION,
        LIGHTHOUSE_AUDIT_STEP_TYPE.START_TIMESPAN,
        LIGHTHOUSE_AUDIT_STEP_TYPE.END_TIMESPAN,
        LIGHTHOUSE_AUDIT_STEP_TYPE.SNAPSHOT,
      ],
    });

    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Custom Steps',
      icon: 'puppeteer-badge',
      options: [AUDIT_CUSTOM_STEP_TYPE.CLEAR_CACHE, AUDIT_CUSTOM_STEP_TYPE.ADD_COOKIE],
    });
  });
});
