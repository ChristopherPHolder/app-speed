import { Route } from '@angular/router';
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
        path: 'audits',
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
        loadChildren: () =>
          import('@app-speed/convenience/feature-catalog').then((module) => module.convenienceCatalogRoutes),
      },
      { path: '', redirectTo: 'audits/history', pathMatch: 'full' },
    ],
  },
];
