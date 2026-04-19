import { Observable } from 'rxjs';
import type {
  ScheduleAuditResponse,
} from '@app-speed/audit/api-contract';
import type { AuditDetails } from '@app-speed/audit/model';

export type {
  ScheduleAuditBadRequestResponse,
  ScheduleAuditDecodeErrorIssue,
  ScheduleAuditDecodeErrorResponse,
  ScheduleAuditErrorResponse,
  ScheduleAuditRequest,
  ScheduleAuditResponse,
} from '@app-speed/audit/api-contract';

export interface ApiModel {
  /**
   * Schedules a long-running audit and returns the scheduling receipt.
   * Non-2xx responses are surfaced via HttpClient as HttpErrorResponse with a
   * body matching ScheduleAuditErrorResponse.
   */
  scheduleAudit(req: AuditDetails): Observable<ScheduleAuditResponse>;
}
