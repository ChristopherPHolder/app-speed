import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { AuditProgressService } from '@app-speed/audit/user-flow/portal-data-access';
import { shellRoutes } from '../shell/shell.routes';
import { PortalAuthService } from '../auth/portal-auth.service';
import { auditScopeInterceptor } from './audit-scope';
import { WorkspaceState } from './workspace-state.service';

describe('persisted audit deep links', () => {
  it.each(['scheduled', 'running', 'done', 'failed', 'unavailable'] as const)(
    'opens a %s run on initial navigation with its project scope and history link',
    async (stage) => {
      const progress = {
        stageName$: new BehaviorSubject(stage),
        queuePosition$: new BehaviorSubject(0),
        watchAudit: vi.fn(),
      };
      const state = {
        overview: signal<{ workspaces: { id: string; projects: { id: string }[] }[] } | undefined>(undefined),
        refresh: vi.fn(async () => {
          state.overview.set({ workspaces: [{ id: 'workspace-a', projects: [{ id: 'project-a' }] }] });
          return true;
        }),
        selectWorkspace: vi.fn(),
        selectProject: vi.fn(),
      };
      TestBed.configureTestingModule({
        providers: [
          provideRouter(shellRoutes[0].children ?? [], withComponentInputBinding()),
          provideHttpClient(withInterceptors([auditScopeInterceptor])),
          provideHttpClientTesting(),
          { provide: PortalAuthService, useValue: { hasSession: async () => true, sessionToken: async () => 'token' } },
          { provide: WorkspaceState, useValue: state },
          { provide: AuditProgressService, useValue: progress },
        ],
      });
      const target = '/audits/user-flow/run-123?projectId=project-a';
      const harness = await RouterTestingHarness.create(target);
      await harness.fixture.whenStable();
      const http = TestBed.inject(HttpTestingController);
      const definition = http.expectOne('/api/audits/user-flow/run-123');
      expect(definition.request.headers.get('x-project-id')).toBe('project-a');
      expect(definition.request.headers.get('Authorization')).toBe('Bearer token');
      if (stage === 'unavailable') {
        definition.flush({}, { status: 404, statusText: 'Not Found' });
      } else {
        definition.flush({ audit: { title: 'Saved run', device: 'mobile', timeout: 30000, steps: [] } });
      }
      await harness.fixture.whenStable();
      harness.detectChanges();
      if (stage === 'done' || stage === 'failed') {
        const result = await vi.waitFor(() => http.expectOne('/api/audits/user-flow/run-123/result'));
        expect(result.request.headers.get('x-project-id')).toBe('project-a');
        result.flush(
          stage === 'done'
            ? { status: 'SUCCESS', result: { steps: [] } }
            : {
                status: 'FAILURE',
                error: { message: 'Replay failed for this saved run' },
              },
        );
        await harness.fixture.whenStable();
        harness.detectChanges();
        if (stage === 'failed')
          expect(harness.routeNativeElement?.textContent).toContain('Replay failed for this saved run');
      }
      if (stage === 'unavailable') {
        expect(harness.routeNativeElement?.querySelector('[role="alert"]')?.textContent).toContain('may not exist');
        expect(harness.routeNativeElement?.querySelector('user-flow-audit-page')).toBeNull();
      }
      expect(TestBed.inject(Router).url).toBe(target);
      expect(state.selectWorkspace).toHaveBeenCalledWith('workspace-a');
      expect(state.selectProject).toHaveBeenCalledWith('project-a');
      expect(progress.watchAudit).toHaveBeenCalledWith('run-123');
      const back = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a');
      expect(back?.getAttribute('href')).toBe('/audits/user-flow/history?projectId=project-a');
      back?.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/audits/user-flow/history?projectId=project-a');
      http
        .match((request) => request.url === '/api/audits/user-flow/history')
        .forEach((request) => request.flush({ items: [], nextCursor: null }));
      http.verify();
    },
  );
});
