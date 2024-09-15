import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { BehaviorSubject, filter, map, merge } from 'rxjs';
import { CONDUCTOR_STAGE, isDoneStageChangeMessage, isStageChangeMessage } from '@app-speed/shared/websocket-util-lib';

const STAGE = {
  BUILDING: 'building',
  PROCESSING: 'processing',
  SCHEDULING: 'scheduling',
  ...CONDUCTOR_STAGE,
} as const satisfies Record<string, string>;

const NO_DISPLAY_STAGES = [STAGE.BUILDING, CONDUCTOR_STAGE.DONE] as string[];

export type Stage = (typeof STAGE)[keyof typeof STAGE];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  webSocket = webSocket('wss://3b6gqoq7s8.execute-api.us-east-1.amazonaws.com/prod/');

  readonly #processStage$ = new BehaviorSubject<Stage>(STAGE.BUILDING);

  stage = this.webSocket.pipe(filter(isStageChangeMessage));
  readonly stageName$ = merge(this.#processStage$, this.stage.pipe(map((stage) => stage.stage)));

  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));

  readonly key$ = this.stage.pipe(
    filter(isDoneStageChangeMessage),
    map((event) => event.key),
  );

  constructor() {
    this.webSocket.subscribe((event) => {
      console.log('webSocket event', event);
    });
  }

  submitAudit(auditDetails: any) {
    this.#processStage$.next(STAGE.SCHEDULING);
    this.webSocket.next({
      action: 'schedule-audit',
      audit: JSON.stringify(auditDetails),
    });
  }
}
