import { provideAuditBuilderIcons } from '@app-speed/audit/core/portal-ui/icons';
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
    path: ':id',
    loadChildren: () => import('@app-speed/audit/user-flow/feature-viewer').then((m) => m.userFlowAuditViewerRoutes),
  },
  {
    path: '',
    component: BuilderComponent,
    providers: provideAuditBuilderRoute(),
  },
];
