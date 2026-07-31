import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { AuditHistoryPageComponent } from './audit-history-page.component';
import { AuditHistoryApiService } from './api/audit-history-api.service';
import { AuditHistoryPage } from './api/audit-history.models';

describe('AuditHistoryPageComponent', () => {
  let fixture: ComponentFixture<AuditHistoryPageComponent>;
  let component: AuditHistoryPageComponent;
  const listHistory = vi.fn();
  const navigate = vi.fn();

  const stubPage: AuditHistoryPage = {
    items: [
      {
        kind: 'user-flow',
        auditId: 'audit-1',
        title: 'Example audit',
        status: 'SCHEDULED',
        resultStatus: null,
        queuePosition: 0,
        createdAt: new Date('2026-03-03T10:00:00.000Z').toISOString(),
        startedAt: null,
        completedAt: null,
        durationMs: null,
      },
    ],
    nextCursor: 'cursor-2',
    limit: 25,
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    listHistory.mockReset();
    listHistory.mockReturnValue(of(stubPage));
    navigate.mockReset();

    await TestBed.configureTestingModule({
      imports: [AuditHistoryPageComponent],
      providers: [
        { provide: AuditHistoryApiService, useValue: { listHistory } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                auditHistory: {
                  endpoint: '/api/audits/user-flow/history',
                  resultRoute: (run: { auditId: string }) => ['/audits/user-flow', run.auditId],
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditHistoryPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates every run to the canonical user-flow result route', () => {
    component.openRun({
      kind: 'user-flow',
      auditId: 'complete-audit',
      title: 'Complete',
      status: 'COMPLETE',
      resultStatus: 'SUCCESS',
      queuePosition: null,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 1200,
    });

    expect(navigate).toHaveBeenCalledWith(['/audits/user-flow', 'complete-audit']);

    component.openRun({
      kind: 'user-flow',
      auditId: 'running-audit',
      title: 'Running',
      status: 'IN_PROGRESS',
      resultStatus: null,
      queuePosition: null,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationMs: null,
    });

    expect(navigate).toHaveBeenCalledWith(['/audits/user-flow', 'running-audit']);
  });

  it('preserves status filtering and cursor pagination for the configured endpoint', () => {
    expect(listHistory).toHaveBeenNthCalledWith(1, '/api/audits/user-flow/history', {
      limit: 25,
      cursor: null,
      status: undefined,
    });

    component.toggleStatus('SCHEDULED');
    expect(listHistory).toHaveBeenNthCalledWith(2, '/api/audits/user-flow/history', {
      limit: 25,
      cursor: null,
      status: ['IN_PROGRESS', 'COMPLETE'],
    });

    component.goToNextPage();
    expect(listHistory).toHaveBeenNthCalledWith(3, '/api/audits/user-flow/history', {
      limit: 25,
      cursor: 'cursor-2',
      status: ['IN_PROGRESS', 'COMPLETE'],
    });
    expect(component.hasPreviousPage()).toBe(true);

    component.goToPreviousPage();
    expect(listHistory).toHaveBeenNthCalledWith(4, '/api/audits/user-flow/history', {
      limit: 25,
      cursor: null,
      status: ['IN_PROGRESS', 'COMPLETE'],
    });
  });
});
