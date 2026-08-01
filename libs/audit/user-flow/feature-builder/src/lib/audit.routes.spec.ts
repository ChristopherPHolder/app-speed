import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterOutlet, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ApiClient, AuditProgressService } from '@app-speed/audit/user-flow/portal-data-access';
import { BehaviorSubject, of } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { auditBuilderRoutes } from './audit.routes';
import { DEFAULT_AUDIT_DETAILS } from './audit-details';
import { AuditResultPageComponent } from './feature/audit-result-page.component';
import { BuilderComponent } from './feature/builder.component';

describe('auditBuilderRoutes', () => {
  it('uses the canonical builder and result paths', () => {
    expect(auditBuilderRoutes.map((route) => route.path)).toEqual([':id', '']);
    expect(auditBuilderRoutes.at(-1)?.component).toBe(BuilderComponent);
  });

  it('uses the result shell for persisted user-flow audits', () => {
    const resultRoute = auditBuilderRoutes.find((route) => route.path === ':id');

    expect(resultRoute?.component).toBe(AuditResultPageComponent);
  });

  it('keeps the submitted audit visible and read-only while it runs', async () => {
    const stageName$ = new BehaviorSubject<'running'>('running');

    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'audits/user-flow', children: auditBuilderRoutes }], withComponentInputBinding()),
        {
          provide: AuditProgressService,
          useValue: {
            stageName$,
            queuePosition$: new BehaviorSubject<number | null>(null),
            watchAudit: vi.fn(),
          },
        },
        {
          provide: ApiClient,
          useValue: {
            findAudit: () => of({ status: 'IN_PROGRESS', audit: DEFAULT_AUDIT_DETAILS }),
          },
        },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/audits/user-flow/run-123');
    await harness.fixture.whenStable();

    const root: HTMLElement = harness.fixture.nativeElement;
    const auditCard = root.querySelector('[data-testid="audit-builder-card"]');

    expect(auditCard?.classList.contains('audit-card--readonly')).toBe(true);
    expect(root.querySelector<HTMLInputElement>('input[name="audit title"]')?.disabled).toBe(true);
    expect(root.textContent).not.toContain('Fork');
  });

  it('offers to fork the persisted audit after it completes', async () => {
    const stageName$ = new BehaviorSubject<'running' | 'done'>('running');

    await TestBed.configureTestingModule({
      imports: [RouterOutlet],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'audits/user-flow', children: auditBuilderRoutes }], withComponentInputBinding()),
        {
          provide: AuditProgressService,
          useValue: {
            stageName$,
            queuePosition$: new BehaviorSubject<number | null>(null),
            watchAudit: vi.fn(),
          },
        },
        {
          provide: ApiClient,
          useValue: {
            findAudit: () => of({ status: 'COMPLETE', audit: DEFAULT_AUDIT_DETAILS }),
          },
        },
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/audits/user-flow/run-123');

    stageName$.next('done');
    await harness.fixture.whenStable();

    const root: HTMLElement = harness.fixture.nativeElement;
    expect(root.textContent).toContain('Fork');
  });
});
