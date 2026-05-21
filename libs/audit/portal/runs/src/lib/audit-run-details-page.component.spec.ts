import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { AuditRunDetailsPageComponent } from './audit-run-details-page.component';
import { AuditRunsApiService } from './api/audit-runs-api.service';
import type { AuditRunSummary } from './api/audit-runs.models';

describe('AuditRunDetailsPageComponent', () => {
  let fixture: ComponentFixture<AuditRunDetailsPageComponent>;
  const navigate = vi.fn();
  const getRun = vi.fn();

  beforeEach(async () => {
    vi.useFakeTimers();
    navigate.mockReset();
    getRun.mockReset();

    await TestBed.configureTestingModule({
      imports: [AuditRunDetailsPageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'complete-audit' }) },
            paramMap: of(convertToParamMap({ id: 'complete-audit' })),
          },
        },
        { provide: AuditRunsApiService, useValue: { getRun } },
        { provide: Router, useValue: { navigate } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('redirects completed runs to the canonical user-flow route', async () => {
    getRun.mockReturnValue(
      of<AuditRunSummary>({
        auditId: 'complete-audit',
        title: 'Complete',
        status: 'COMPLETE',
        resultStatus: 'SUCCESS',
        queuePosition: null,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 1200,
      }),
    );

    fixture = TestBed.createComponent(AuditRunDetailsPageComponent);
    fixture.detectChanges();

    await vi.advanceTimersByTimeAsync(5000);

    expect(navigate).toHaveBeenCalledWith(['/user-flow'], {
      queryParams: { auditId: 'complete-audit' },
    });
  });
});
