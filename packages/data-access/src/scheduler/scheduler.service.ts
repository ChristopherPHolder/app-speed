import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { BehaviorSubject, filter, map, merge, tap } from 'rxjs';

// TODO should consume the type from the service!
type StageChangeResponse = {
  type: 'stage-change';
  stage: string;
  message?: string;
  key?: string;
};

function isStageChangeResponse(message: unknown): message is StageChangeResponse {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    'stage' in message &&
    message.type === 'stage-change'
  );
}

const STAGE = {
  BUILDING: 'building',
  PROCESSING: 'processing',
  SCHEDULING: 'scheduling',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  DONE: 'done',
} as const satisfies Record<string, string>;

const NO_DISPLAY_STAGES = [STAGE.BUILDING, STAGE.DONE] as string[];

export type Stage = (typeof STAGE)[keyof typeof STAGE];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  webSocket = webSocket('wss://3b6gqoq7s8.execute-api.us-east-1.amazonaws.com/prod/');

  readonly #processStage$ = new BehaviorSubject<Stage>(STAGE.BUILDING);

  stage = this.webSocket.pipe(filter(isStageChangeResponse));
  readonly stageName$ = merge(this.#processStage$, this.stage.pipe(map((stage) => stage.stage)));

  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));

  readonly key$ = this.stage.pipe(
    filter((event) => event.stage === 'done' && !!event.key),
    map((event) => event.key!),
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
