import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { of, Subject } from 'rxjs';
import { ApiClient } from '@app-speed/audit/portal/data-access';
import { auditBuilderRoutes } from './audit.routes';
import { DEFAULT_AUDIT_DETAILS } from './audit-details';
import { AuditProgressService } from './api/audit-progress.service';
import { BuilderComponent } from './feature/builder.component';

describe('auditBuilderRoutes', () => {
  const stageName$ = new Subject<'scheduling' | 'scheduled' | 'running' | 'done' | 'failed'>();
  const queuePosition$ = new Subject<number>();
  const key$ = new Subject<string>();
  const watchAudit = vi.fn();
  const scheduleAudit = vi.fn();

  beforeEach(() => {
    watchAudit.mockReset();
    scheduleAudit.mockReset();
  });

  const configureRouteTestingModule = async () => {
    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({}),
        provideEffects({}),
        { provide: ApiClient, useValue: { scheduleAudit } },
        { provide: AuditProgressService, useValue: { stageName$, queuePosition$, key$, watchAudit } },
        provideRouter([{ path: 'user-flow', children: auditBuilderRoutes }]),
      ],
    }).compileComponents();
  };

  it('loads persisted run details when visiting the canonical result URL', async () => {
    await configureRouteTestingModule();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/user-flow/results/run-123', BuilderComponent);

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/audit/runs/run-123/details');
    expect(request.request.method).toBe('GET');
    request.flush({
      auditId: 'run-123',
      audit: DEFAULT_AUDIT_DETAILS,
      status: 'SCHEDULED',
      resultStatus: null,
      queuePosition: 2,
      createdAt: '2026-03-03T10:00:00.000Z',
      startedAt: null,
      completedAt: null,
      durationMs: null,
    });

    http.verify();
  });

  it('redirects the bare results route to history', async () => {
    await configureRouteTestingModule();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/user-flow/results');

    expect(TestBed.inject(Router).url).toBe('/user-flow/results/history');

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/audit/runs?limit=25');
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [],
      nextCursor: null,
      limit: 25,
    });
    http.verify();
  });

  it('shows an inline error instead of the draft builder when the result id cannot be loaded', async () => {
    await configureRouteTestingModule();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/user-flow/results/missing-run', BuilderComponent);

    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/audit/runs/missing-run/details');
    request.flush({ message: 'Run not found.' }, { status: 404, statusText: 'Not Found' });
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();

    const root = harness.fixture.nativeElement as HTMLElement;
    expect(TestBed.inject(Router).url).toBe('/user-flow/results/missing-run');
    expect(root.querySelector('ui-audit-builder')).toBeNull();
    expect(root.querySelector('[data-testid="audit-inline-error"]')?.textContent).toContain('Run not found.');
    expect(root.querySelector('[data-testid="audit-inline-error"]')?.textContent).toContain('Run could not be loaded');

    http.verify();
  });

  it('navigates submitted drafts to the canonical result URL without draft query details', async () => {
    await configureRouteTestingModule();
    scheduleAudit.mockReturnValue(of({ auditId: 'scheduled-123', auditQueuePosition: 1 }));

    const harness = await RouterTestingHarness.create();
    const builder = await harness.navigateByUrl(
      `/user-flow?audit-details=${encodeURIComponent(JSON.stringify(DEFAULT_AUDIT_DETAILS))}`,
      BuilderComponent,
    );

    builder.updateAuditDetails(DEFAULT_AUDIT_DETAILS);
    builder.submitAudit(DEFAULT_AUDIT_DETAILS);
    await harness.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 600));
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/user-flow/results/scheduled-123');
    expect(watchAudit).toHaveBeenCalledWith('scheduled-123');
  });
});
