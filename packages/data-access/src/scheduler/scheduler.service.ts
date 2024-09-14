import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { filter, map } from 'rxjs';

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

  public readonly key$ = this.webSocket.pipe(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    filter((event) => event.type === 'done'),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
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
