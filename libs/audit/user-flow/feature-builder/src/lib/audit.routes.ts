import { AUDIT_RESULT_ROUTE } from '@app-speed/audit/portal/ui';
import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';
import { Routes } from '@angular/router';
import { BuilderComponent } from './feature/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './feature/builder.state';
import { provideBuilderEffects } from './feature/builder.effects';

const provideAuditBuilderRoute = () => [
  provideState(auditBuilderFeature),
  provideBuilderEffects(),
  provideAuditBuilderIcons(),
];

export const auditBuilderRoutes: Routes = [
  {
    path: 'history',
    loadChildren: () => import('@app-speed/audit/core/feature-history').then((m) => m.auditHistoryRoutes),
    providers: [
      {
        provide: AUDIT_RESULT_ROUTE,
        useValue: (auditId: string) => ({ commands: ['/audits/user-flow', auditId] }),
      },
    ],
  },
  {
    path: ':id',
    loadChildren: () => import('@app-speed/audit/user-flow/feature-viewer').then((m) => m.userFlowAuditViewerRoutes),
  },
  {
    path: '',
    component: BuilderComponent,
    providers: provideAuditBuilderRoute(),
  },
];
