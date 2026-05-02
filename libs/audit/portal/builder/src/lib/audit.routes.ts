import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';
import { Routes } from '@angular/router';
import { BuilderComponent } from './feature/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './feature/builder.state';
import { provideBuilderEffects } from './feature/builder.effects';

export const auditBuilderRoutes: Routes = [
  {
    path: '',
    component: BuilderComponent,
    providers: [provideState(auditBuilderFeature), provideBuilderEffects(), provideAuditBuilderIcons()],
  },
];
