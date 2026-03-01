import { Routes } from '@angular/router';
import { AuditBuilderContainer } from './audit-builder.container';

export const routes: Routes = [
  {
    path: ':audit-details',
    component: AuditBuilderContainer,
  },
  { path: '**', redirectTo: ':audit-details' },
];
