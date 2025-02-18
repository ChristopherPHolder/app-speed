import type { FlowResult } from 'lighthouse';

export type SuccessfulAuditResult = {
  status: 'success';
  result: FlowResult;
};

export type FailedAuditResult = {
  status: 'failed';
  error: string;
};

export type UploadAuditResultsRequestBody<AuditResult = SuccessfulAuditResult | FailedAuditResult> = {
  data: {
    auditId: string;
    auditResult: AuditResult;
  };
};

export function isFailedAuditResult(
  requestBody: UploadAuditResultsRequestBody,
): requestBody is UploadAuditResultsRequestBody<FailedAuditResult> {
  return requestBody.data.auditResult.status === 'failed';
}

export function isSuccessfulAuditResult(
  requestBody: UploadAuditResultsRequestBody,
): requestBody is UploadAuditResultsRequestBody<SuccessfulAuditResult> {
  return requestBody.data.auditResult.status === 'success';
}
