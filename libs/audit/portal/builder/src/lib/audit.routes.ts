import { Routes } from '@angular/router';
import { BuilderComponent } from './feature/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './feature/builder.state';
import { provideBuilderEffects } from './feature/builder.effects';
import { AuditComponent } from './audit.component';
import { provideAuditBuilderIcons } from './components/audit-builder-icons.provider';

export const auditBuilderRoutes: Routes = [
  {
    path: '',
    component: AuditComponent,
    providers: [provideState(auditBuilderFeature), provideBuilderEffects()],
    children: [
      {
        path: '',
        component: BuilderComponent,
        providers: [provideAuditBuilderIcons()],
      },
    ],
  },
];
