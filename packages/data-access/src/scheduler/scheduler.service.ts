import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { filter, map } from 'rxjs';

const STAGE = {
  INITIALIZING: 'initializing',
  SCHEDULING: 'scheduling',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  RUNNING_FAILED: 'failed',
  FETCHING: 'fetching',
  COMPLETE: 'complete',
} as const;

type Stage = {
  type: string;
  stage: string;
};

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

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  webSocket = webSocket('wss://3b6gqoq7s8.execute-api.us-east-1.amazonaws.com/prod/');

  stage = this.webSocket.pipe(filter(isStageChangeResponse));
  processing = this.stage.pipe(
    map(({ stage, message }) => {
      if (stage === 'complete') return false;
      return { stage, message };
    }),
  );

  key$ = this.webSocket.pipe(
    // @ts-ignore
    filter((event) => event.type === 'done'),
    // @ts-ignore
    map((event) => event.key as string),
  );

  constructor() {
    this.webSocket.subscribe((event) => {
      console.log('webSocket event', event);
    });
  }

  submitAudit(auditDetails: any) {
    this.webSocket.next({
      action: 'schedule-audit',
      audit: JSON.stringify(auditDetails),
    });
  }
}
