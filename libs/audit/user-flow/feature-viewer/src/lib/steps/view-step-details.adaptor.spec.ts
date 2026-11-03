import { describe, expect, it } from 'vitest';
import type { FlowResult } from 'lighthouse';
import { STATUS } from '@app-speed/ui/status-badge';
import { metricResults } from './view-step-details.adaptor';

describe('metricResults', () => {
  it('shows the reason a soft navigation metric could not be measured', () => {
    const audit: FlowResult.Step['lhr']['audits'][string] = {
      id: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'Time until the first content is painted.',
      score: null,
      scoreDisplayMode: 'error',
      errorMessage: 'Lighthouse did not detect a soft navigation.',
    };
    expect(metricResults([audit.id], { [audit.id]: audit })).toEqual([
      {
        name: audit.title,
        value: 'Not measured',
        description: audit.description,
        status: STATUS.ALERT,
        errorMessage: audit.errorMessage,
      },
    ]);
  });
});
