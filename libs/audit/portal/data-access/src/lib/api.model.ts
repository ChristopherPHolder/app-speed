import { Observable } from 'rxjs';
import type {
  ScheduleAuditRequest,
  ScheduleAuditResponse,
} from '@app-speed/audit/contracts';

export type {
  ScheduleAuditBadRequestResponse,
  ScheduleAuditDecodeErrorIssue,
  ScheduleAuditDecodeErrorResponse,
  ScheduleAuditErrorResponse,
  ScheduleAuditRequest,
  ScheduleAuditResponse,
} from '@app-speed/audit/contracts';

export interface ApiModel {
  /**
   * Schedules a long-running audit and returns the scheduling receipt.
   * Non-2xx responses are surfaced via HttpClient as HttpErrorResponse with a
   * body matching ScheduleAuditErrorResponse.
   */
  scheduleAudit(req: ScheduleAuditRequest): Observable<ScheduleAuditResponse>;
}
