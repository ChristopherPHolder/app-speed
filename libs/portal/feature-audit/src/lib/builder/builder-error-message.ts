import { HttpErrorResponse } from '@angular/common/http';

type StructuredErrorIssue = {
  path?: ReadonlyArray<string | number>;
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const formatIssuePath = (path: ReadonlyArray<string | number>) =>
  path.reduce((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : segment;
  }, '');

const formatStructuredIssue = (issue: StructuredErrorIssue) => {
  if (!issue.message) {
    return null;
  }
  if (!issue.path?.length) {
    return issue.message;
  }
  return `${formatIssuePath(issue.path)}: ${issue.message}`;
};

export const getAuditRequestErrorMessage = (error: unknown) => {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.length > 0) {
      return error.error;
    }

    if (isRecord(error.error)) {
      const issues = Array.isArray(error.error['issues'])
        ? error.error['issues']
            .filter(isRecord)
            .map((issue) =>
              formatStructuredIssue({
                path: Array.isArray(issue['path']) ? (issue['path'] as ReadonlyArray<string | number>) : undefined,
                message: typeof issue['message'] === 'string' ? issue['message'] : undefined,
              }),
            )
            .filter((message): message is string => !!message)
        : [];

      if (issues.length > 0) {
        return issues.join('\n');
      }

      if (typeof error.error['message'] === 'string' && error.error['message'].length > 0) {
        return error.error['message'];
      }
    }

    if (error.message.length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Audit request failed.';
};
