import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { signal } from '@angular/core';
import { PortalAuthService } from '../auth/portal-auth.service';
import { WorkspaceState } from './workspace-state.service';
import { auditScopeInterceptor, AuditScopeRouteReuseStrategy, selectAuditContext } from './audit-scope';

const snapshot = (projectId?: string) => {
  const route = new ActivatedRouteSnapshot();
  route.queryParams = projectId ? { projectId } : {};
  return route;
};

describe('audit request scope', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([auditScopeInterceptor])),
        provideHttpClientTesting(),
        { provide: PortalAuthService, useValue: { sessionToken: async () => 'verified-session' } },
      ],
    }),
  );

  it('attaches project context and authentication only to project audit requests', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/audits/history?projectId=project-a');
    const response = firstValueFrom(TestBed.inject(HttpClient).get('/api/audits/history'));
    await Promise.resolve();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/audits/history');
    expect(request.request.headers.get('x-project-id')).toBe('project-a');
    expect(request.request.headers.get('Authorization')).toBe('Bearer verified-session');
    request.flush({ items: [] });
    await response;
    TestBed.inject(HttpClient).get('/api/workspaces').subscribe();
    const management = TestBed.inject(HttpTestingController).expectOne('/api/workspaces');
    expect(management.request.headers.has('x-project-id')).toBe(false);
    management.flush({});
  });

  it('keeps Public View requests public even when a workspace preference exists', () => {
    TestBed.inject(HttpClient).get('/api/audits/history').subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/audits/history');
    expect(request.request.headers.has('x-project-id')).toBe(false);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('destroys mounted audit views when project query context changes', () => {
    const strategy = new AuditScopeRouteReuseStrategy();
    const current = snapshot('project-a');
    expect(strategy.shouldReuseRoute(snapshot('project-b'), current)).toBe(false);
    expect(strategy.shouldReuseRoute(snapshot('project-a'), current)).toBe(true);
    expect(strategy.shouldReuseRoute(snapshot(), current)).toBe(false);
  });

  it('restores a copied project URL from authorized overview data and rejects unknown projects', async () => {
    const state = {
      overview: signal({ workspaces: [{ id: 'workspace-a', projects: [{ id: 'project-a' }] }] }),
      selectWorkspace: vi.fn(),
      selectProject: vi.fn(),
      selectPublicView: vi.fn(),
      refresh: vi.fn(),
    };
    TestBed.overrideProvider(WorkspaceState, { useValue: state });
    const run = (projectId?: string) =>
      TestBed.runInInjectionContext(() =>
        selectAuditContext(snapshot(projectId), TestBed.inject(Router).routerState.snapshot),
      );
    expect(await run('project-a')).toBe(true);
    expect(state.selectWorkspace).toHaveBeenCalledWith('workspace-a');
    expect(state.selectProject).toHaveBeenCalledWith('project-a');
    expect(String(await run('unknown'))).toBe('/workspaces');
    expect(await run()).toBe(true);
    expect(state.selectPublicView).toHaveBeenCalled();
  });
});
