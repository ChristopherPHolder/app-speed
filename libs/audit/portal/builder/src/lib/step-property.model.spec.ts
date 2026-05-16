import { describe, expect, it } from 'vitest';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/domain';
import { STEP_SELECTION_OPTIONS_GROUPED } from './step-property.model';

describe('STEP_SELECTION_OPTIONS_GROUPED', () => {
  it('keeps custom steps in the unified selector with the audit grouping', () => {
    expect(STEP_SELECTION_OPTIONS_GROUPED).toContainEqual({
      label: 'Audit Steps',
      icon: 'lighthouse-badge',
      options: Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE),
    });
  });
});
