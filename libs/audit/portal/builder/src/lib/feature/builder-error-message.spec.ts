import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { getAuditRequestErrorMessage } from './builder-error-message';

describe('getAuditRequestErrorMessage', () => {
  it('formats structured decode issues from the API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: '/api/audit/schedule',
      error: {
        _tag: 'HttpApiDecodeError',
        message: 'ReplayUserflowAudit\n└─ ["title"]\n   └─ is missing',
        issues: [
          {
            _tag: 'Missing',
            path: ['title'],
            message: 'is missing',
          },
          {
            _tag: 'Type',
            path: ['steps', 0, 'url'],
            message: 'Expected string, actual undefined',
          },
        ],
      },
    });

    expect(getAuditRequestErrorMessage(error)).toBe(
      'title: is missing\nsteps[0].url: Expected string, actual undefined',
    );
  });

  it('falls back to the structured API message when issues are not present', () => {
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: '/api/audit/schedule',
      error: {
        message: 'Request payload did not match the expected schema.',
      },
    });

    expect(getAuditRequestErrorMessage(error)).toBe('Request payload did not match the expected schema.');
  });

  it('falls back to the Angular HTTP message when the body is not structured', () => {
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      url: '/api/audit/schedule',
    });

    expect(getAuditRequestErrorMessage(error)).toContain('400 Bad Request');
  });
});
