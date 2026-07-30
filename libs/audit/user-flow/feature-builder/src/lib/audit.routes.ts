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
    path: 'results',
    redirectTo: 'results/history',
    pathMatch: 'full',
  },
  {
    path: 'results/history',
    loadChildren: () => import('@app-speed/audit/portal/viewer/runs').then((m) => m.auditHistoryRoutes),
  },
  {
    path: 'results/:id',
    component: BuilderComponent,
    providers: provideAuditBuilderRoute(),
  },
  {
    path: '',
    component: BuilderComponent,
    providers: provideAuditBuilderRoute(),
  },
];
