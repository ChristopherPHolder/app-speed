import { Injectable } from '@angular/core';
import type { ApiModel } from './api.model';

export type {
  ApiModel,
  ScheduleAuditBadRequestResponse,
  ScheduleAuditDecodeErrorIssue,
  ScheduleAuditDecodeErrorResponse,
  ScheduleAuditErrorResponse,
  ScheduleAuditRequest,
  ScheduleAuditResponse,
} from './api.model';

@Injectable({ providedIn: 'root' })
export class Api implements ApiModel {
  declare scheduleAudit: ApiModel['scheduleAudit'];
}
