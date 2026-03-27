import { Routes } from '@angular/router';
import { BuilderComponent } from './builder/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './builder/builder.state';
import { provideBuilderEffects } from './builder/builder.effects';
import { AuditComponent } from './audit.component';
import { provideAuditBuilderIcons } from './ui/audit-builder-icons.provider';

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
