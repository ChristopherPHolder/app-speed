import { inject, Injector } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import {
  ActivatedRouteSnapshot,
  BaseRouteReuseStrategy,
  CanActivateChildFn,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, from, switchMap, takeUntil } from 'rxjs';
import { PortalAuthService } from '../auth/portal-auth.service';

export const selectAuditContext: CanActivateChildFn = async (route, navigation) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = inject(PortalAuthService);
  // Workspace schemas and their Effect runtime stay outside the public initial bundle.
  const { WorkspaceState } = await import('./workspace-state.service');
  const state = injector.get(WorkspaceState);
  const projectId = route.queryParamMap.get('projectId');
  if (!projectId) {
    state.selectPublicView();
    return true;
  }
  if (!(await auth.hasSession())) {
    return router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: navigation.url } });
  }
  if (!state.overview() && !(await state.refresh())) return router.parseUrl('/audit-unavailable');
  const workspace = state.overview()?.workspaces.find((item) => item.projects.some((p) => p.id === projectId));
  if (!workspace) return router.parseUrl('/audit-unavailable');
  state.selectWorkspace(workspace.id);
  state.selectProject(projectId);
  return true;
};

// Scope travels in audit URLs, including reloads and copied links. Never infer it from a stale preference.
export const auditScopeInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const auth = inject(PortalAuthService);
  if (!request.url.startsWith('/api/audits/')) return next(request);
  const url = router.url;
  const projectId = router.parseUrl(url).queryParams['projectId'];
  const response = projectId
    ? from(auth.sessionToken()).pipe(
        switchMap((token) => {
          if (!token) throw new Error('Sign in to access project audits.');
          return next(request.clone({ setHeaders: { 'x-project-id': projectId, Authorization: `Bearer ${token}` } }));
        }),
      )
    : next(request);
  return response.pipe(
    takeUntil(
      router.events.pipe(
        filter(
          (event) =>
            event instanceof NavigationStart &&
            (event.url.split('?')[0] !== url.split('?')[0] ||
              router.parseUrl(event.url).queryParams['projectId'] !== projectId),
        ),
      ),
    ),
  );
};

export class AuditScopeRouteReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, current: ActivatedRouteSnapshot): boolean {
    return (
      super.shouldReuseRoute(future, current) &&
      future.queryParamMap.get('projectId') === current.queryParamMap.get('projectId')
    );
  }
}
