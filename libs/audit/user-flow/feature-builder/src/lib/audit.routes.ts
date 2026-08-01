import { provideAuditBuilderIcons } from '@app-speed/audit/core/portal-ui/icons';
import { Routes } from '@angular/router';
import { BuilderComponent } from './feature/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './feature/builder.state';
import { provideBuilderEffects } from './feature/builder.effects';
import { AuditResultPageComponent } from './feature/audit-result-page.component';

const provideAuditBuilderRoute = () => [
  provideState(auditBuilderFeature),
  provideBuilderEffects(),
  provideAuditBuilderIcons(),
];

export const auditBuilderRoutes: Routes = [
  {
    path: ':id',
    component: AuditResultPageComponent,
    providers: [provideAuditBuilderIcons()],
  },
  {
    path: '',
    component: BuilderComponent,
    providers: provideAuditBuilderRoute(),
  },
];
