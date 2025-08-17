import { Routes } from '@angular/router';
import { BuilderComponent } from './builder/builder.component';
import { provideState } from '@ngrx/store';
import { auditBuilderFeature } from './builder/builder.state';
import { provideBuilderEffects } from './builder/builder.effects';

export const auditRoutes: Routes = [
  {
    path: '',
    component: BuilderComponent,
    providers: [provideState(auditBuilderFeature), provideBuilderEffects()],
  },
];
