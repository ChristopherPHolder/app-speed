import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { BehaviorSubject, filter, map, merge } from 'rxjs';
import {
  CONDUCTOR_EVENT_SCHEDULE_AUDIT,
  CONDUCTOR_SOCKET_HOST,
  CONDUCTOR_SOCKET_PATH,
  AUDIT_STAGE,
  AuditStage,
  isConductorStageChangeEvent,
  isConductorEventMessage,
  isConductorStageChangeDoneEventMessage,
} from '@app-speed/shared-conductor';

const NO_DISPLAY_STAGES = [AUDIT_STAGE.BUILDING, AUDIT_STAGE.DONE] as string[];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  webSocket = webSocket(`${CONDUCTOR_SOCKET_HOST}/${CONDUCTOR_SOCKET_PATH}?token=${crypto.randomUUID()}`);

  conductorEventMessage$ = this.webSocket.pipe(filter(isConductorEventMessage));

  readonly #processStage$ = new BehaviorSubject<AuditStage>(AUDIT_STAGE.BUILDING);

  stage$ = this.conductorEventMessage$.pipe(filter((message) => isConductorStageChangeEvent(message)));
  readonly stageName$ = merge(this.#processStage$, this.stage$.pipe(map((stage) => stage.stage)));

  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));

  readonly key$ = this.stage$.pipe(
    filter(isConductorStageChangeDoneEventMessage),
    map(({ data: { key } }) => key),
  );

  constructor() {
    this.webSocket.subscribe((event) => {
      console.log('webSocket event', event);
    });
  }

  submitAudit(auditDetails: any) {
    this.#processStage$.next(AUDIT_STAGE.SCHEDULING);
    this.webSocket.next({
      event: CONDUCTOR_EVENT_SCHEDULE_AUDIT,
      data: auditDetails,
    });
  }
}
