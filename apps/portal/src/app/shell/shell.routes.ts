import { selectAuditContext } from '../workspace/audit-scope';
import { inject } from '@angular/core';
import { PortalAuthService } from '../auth/portal-auth.service';
import { Route, Router } from '@angular/router';
import { LandingPageComponent } from '../landing/landing-page.component';
import { ShellComponent } from './shell.component';

type InstalledAuditKind = 'user-flow';

const isInstalledAuditKind = (kind: string): kind is InstalledAuditKind => kind === 'user-flow';

const resultRoute = (run: { kind: string; auditId: string }): ReadonlyArray<string> => {
  if (!isInstalledAuditKind(run.kind)) {
    throw new Error(`Unsupported installed audit kind: ${run.kind}`);
  }

  switch (run.kind) {
    case 'user-flow':
      return ['/audits/user-flow', run.auditId];
  }
};

export const shellRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'public',
        loadComponent: () => import('../workspace/public-view.component').then((m) => m.PublicViewComponent),
        title: 'Public View | App Speed',
      },
      {
        path: 'workspaces',
        canActivate: [
          async () => {
            const auth = inject(PortalAuthService);
            const router = inject(Router);
            return (await auth.hasSession()) || router.parseUrl('/sign-in');
          },
        ],
        loadChildren: () => import('../workspace/workspace.routes').then((m) => m.workspaceRoutes),
      },
      {
        path: 'sign-in',
        loadComponent: () => import('../auth/auth-page.component').then((m) => m.AuthPageComponent),
        title: 'Sign in | App Speed',
      },
      {
        path: 'sign-up',
        loadComponent: () => import('../auth/auth-page.component').then((m) => m.AuthPageComponent),
        data: { signingUp: true },
        title: 'Create account | App Speed',
      },
      {
        path: 'auth/callback',
        loadComponent: () => import('../auth/auth-page.component').then((m) => m.AuthPageComponent),
        data: { callback: true },
        title: 'Signing in | App Speed',
      },
      {
        path: 'audit-unavailable',
        loadComponent: () =>
          import('../workspace/audit-unavailable.component').then((m) => m.AuditUnavailableComponent),
        title: 'Audit unavailable | App Speed',
      },
      {
        path: 'audits',
        canActivateChild: [selectAuditContext],
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        children: [
          {
            path: 'history',
            loadChildren: () => import('@app-speed/audit/core/feature-history').then((m) => m.auditHistoryRoutes),
            data: { auditHistory: { endpoint: '/api/audits/history', resultRoute } },
          },
          {
            path: 'user-flow/history',
            loadChildren: () => import('@app-speed/audit/core/feature-history').then((m) => m.auditHistoryRoutes),
            data: { auditHistory: { endpoint: '/api/audits/user-flow/history', resultRoute } },
          },
          {
            path: 'user-flow',
            loadChildren: () => import('@app-speed/audit/user-flow/feature-builder').then((m) => m.auditBuilderRoutes),
          },
          { path: '', redirectTo: 'history', pathMatch: 'full' },
        ],
      },
      {
        path: 'convenience',
        children: [
          {
            path: 'trace',
            loadChildren: () =>
              import('@app-speed/convenience/trace/feature-tools').then((module) => module.traceConvenienceRoutes),
          },
          {
            path: '',
            loadChildren: () =>
              import('@app-speed/convenience/feature-catalog').then((module) => module.convenienceCatalogRoutes),
          },
        ],
      },
      { path: '', component: LandingPageComponent, pathMatch: 'full', title: 'App Speed' },
    ],
  },
];
