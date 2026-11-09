import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, fromEvent, map, Subject, takeUntil, timer, exhaustMap, takeWhile } from 'rxjs';

type AuditResultResponse =
  | { status: 'SUCCESS'; result: unknown }
  | { status: 'FAILURE'; error: { name: string; message: string; stack: string } };

type AuditStage = 'scheduling' | 'scheduled' | 'running' | 'done' | 'failed';

@Injectable({ providedIn: 'root' })
export class AuditProgressService {
  private readonly router = inject(Router);
  private eventSource: EventSource | null = null;
  private currentAuditId: string | null = null;
  private readonly disconnect$ = new Subject<void>();
  private readonly http = inject(HttpClient);

  private readonly stage$ = new BehaviorSubject<AuditStage>('scheduling');
  private readonly queuePositionState$ = new BehaviorSubject<number | null>(null);
  private readonly resultKey$ = new BehaviorSubject<string | null>(null);

  readonly stageName$ = this.stage$.asObservable();
  readonly queuePosition$ = this.queuePositionState$.asObservable();
  readonly key$ = this.resultKey$.pipe(filter((key): key is string => key !== null));

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((event) => {
        const current = this.router.parseUrl(this.router.url);
        const next = this.router.parseUrl(event.url);
        if (
          event.url.split('?')[0] === this.router.url.split('?')[0] &&
          current.queryParams['projectId'] === next.queryParams['projectId']
        )
          return;
        this.disconnect$.next();
        this.eventSource?.close();
        this.currentAuditId = null;
      });
  }

  private finalizeWithStatus(auditId: string, status: 'SUCCESS' | 'FAILURE') {
    this.stage$.next(status === 'SUCCESS' ? 'done' : 'failed');
    this.resultKey$.next(auditId);
    this.eventSource?.close();
    this.disconnect$.next();
    this.currentAuditId = null;
  }

  private fetchResultAndFinalize(auditId: string) {
    this.http
      .get<AuditResultResponse>(`/api/audits/user-flow/${auditId}/result`)
      .pipe(takeUntil(this.disconnect$))
      .subscribe({
        next: (result) => {
          if (this.currentAuditId !== auditId) {
            return;
          }

          this.finalizeWithStatus(auditId, result.status);
        },
        error: () => {
          if (this.currentAuditId !== auditId) {
            return;
          }

          this.stage$.next('failed');
          this.resultKey$.next(auditId);
          this.eventSource?.close();
          this.disconnect$.next();
          this.currentAuditId = null;
        },
      });
  }

  watchAudit(auditId: string) {
    if (
      this.currentAuditId === auditId &&
      this.eventSource !== null &&
      this.eventSource.readyState !== EventSource.CLOSED
    ) {
      return;
    }

    this.stage$.next('scheduling');
    this.queuePositionState$.next(null);
    this.resultKey$.next(null);

    this.disconnect$.next();
    this.eventSource?.close();
    this.currentAuditId = auditId;

    // Native EventSource cannot carry bearer headers. Poll scoped runs through the authenticated HTTP client.
    if (this.router.parseUrl(this.router.url).queryParams['projectId']) {
      timer(0, 1000)
        .pipe(
          exhaustMap(() =>
            this.http.get<{ status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE'; auditQueuePosition: number }>(
              `/api/audits/user-flow/${auditId}`,
            ),
          ),
          takeWhile((run) => run.status !== 'COMPLETE', true),
          takeUntil(this.disconnect$),
        )
        .subscribe({
          next: (run) => {
            this.queuePositionState$.next(run.auditQueuePosition);
            if (run.status === 'COMPLETE') this.fetchResultAndFinalize(auditId);
            else this.stage$.next(run.status === 'SCHEDULED' ? 'scheduled' : 'running');
          },
          error: () => {
            this.stage$.next('failed');
            this.currentAuditId = null;
          },
        });
      return;
    }

    const source = new EventSource(`/api/audits/user-flow/${auditId}/events`);
    this.eventSource = source;

    fromEvent<MessageEvent>(source, 'position')
      .pipe(
        map((event) => JSON.parse(event.data) as { position: number }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ position }) => this.queuePositionState$.next(position));

    fromEvent<MessageEvent>(source, 'status')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        if (status === 'SCHEDULED') this.stage$.next('scheduled');
        if (status === 'IN_PROGRESS') this.stage$.next('running');
        if (status === 'COMPLETE') this.fetchResultAndFinalize(auditId);
      });

    fromEvent<MessageEvent>(source, 'result')
      .pipe(
        map((event) => JSON.parse(event.data) as { status: 'SUCCESS' | 'FAILURE' }),
        takeUntil(this.disconnect$),
      )
      .subscribe(({ status }) => {
        this.finalizeWithStatus(auditId, status);
      });

    fromEvent<Event>(source, 'error')
      .pipe(takeUntil(this.disconnect$))
      .subscribe(() => {
        if (
          source.readyState === EventSource.CLOSED &&
          this.currentAuditId === auditId &&
          this.stage$.value !== 'done' &&
          this.stage$.value !== 'failed'
        ) {
          this.fetchResultAndFinalize(auditId);
        }
      });
  }
}
