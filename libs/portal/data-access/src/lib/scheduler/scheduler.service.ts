import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, merge } from 'rxjs';
import {
  AUDIT_STAGE,
  AuditStage,
  CONDUCTOR_EVENT_SCHEDULE_AUDIT,
  ConductorStageChangeUnknownMessage,
  isConductorEventMessage,
  isConductorStageChangeDoneEventMessage,
  isConductorStageChangeEvent,
} from '@app-speed/shared-conductor';
import { SocketService } from '../socket.service';

const NO_DISPLAY_STAGES = [AUDIT_STAGE.BUILDING, AUDIT_STAGE.DONE] as string[];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private webSocketService = inject<SocketService<ConductorStageChangeUnknownMessage, any>>(SocketService);

  conductorEventMessage$ = this.webSocketService.messages$.pipe(filter(isConductorEventMessage));

  readonly #processStage$ = new BehaviorSubject<AuditStage>(AUDIT_STAGE.BUILDING);

  stage$ = this.conductorEventMessage$.pipe(filter((message) => isConductorStageChangeEvent(message)));
  readonly stageName$ = merge(this.#processStage$, this.stage$.pipe(map((stage) => stage.stage)));

  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));

  readonly key$ = this.stage$.pipe(
    filter(isConductorStageChangeDoneEventMessage),
    map(({ data: { key } }) => key),
  );

  submitAudit(auditDetails: any) {
    this.#processStage$.next(AUDIT_STAGE.SCHEDULING);
    this.webSocketService.sendMessage({
      event: CONDUCTOR_EVENT_SCHEDULE_AUDIT,
      data: auditDetails,
    });
  }
}
