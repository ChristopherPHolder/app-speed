import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, fromEvent, map, Subject, takeUntil } from 'rxjs';

type AuditStage = 'scheduling' | 'scheduled' | 'running' | 'done' | 'failed';

const NO_DISPLAY_STAGES: AuditStage[] = ['done'];

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  private eventSource: EventSource | null = null;
  private readonly disconnect$ = new Subject<void>();

  private readonly stage$ = new BehaviorSubject<AuditStage>('scheduling');
  private readonly queuePosition$ = new BehaviorSubject<number | null>(null);
  private readonly resultKey$ = new BehaviorSubject<string | null>(null);

  readonly stageName$ = this.stage$.asObservable();
  readonly shouldDisplayIndicator$ = this.stageName$.pipe(map((stage) => !NO_DISPLAY_STAGES.includes(stage)));
  readonly key$ = this.resultKey$.pipe(filter((key): key is string => key !== null));

  watchAudit(auditId: string) {
    this.stage$.next('scheduling');
    this.queuePosition$.next(null);
    this.resultKey$.next(null);

    this.disconnect$.next();
    this.eventSource?.close();

    const source = new EventSource(`/api/audit/${auditId}/events`);
    this.eventSource = source;

    fromEvent<MessageEvent>(source, 'position')
      .pipe(
        map((event) => JSON.parse(event.data) as { position: number }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ position }) => this.queuePosition$.next(position));

    fromEvent<MessageEvent>(source, 'status')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        if (status === 'SCHEDULED') this.stage$.next('scheduled');
        if (status === 'IN_PROGRESS') this.stage$.next('running');
        if (status === 'COMPLETE') this.stage$.next('done');
      });

    fromEvent<MessageEvent>(source, 'result')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SUCCESS' | 'FAILURE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        this.stage$.next(status === 'SUCCESS' ? 'done' : 'failed');
        if (status === 'SUCCESS') this.resultKey$.next(auditId);
        source.close();
      });

    fromEvent<Event>(source, 'error')
      .pipe(takeUntil(this.disconnect$))
      .subscribe(() => {
        if (this.stage$.value !== 'done') {
          this.stage$.next('failed');
        }
      });
  }
}
