import {Route} from '@angular/router';
import { AuditBuilderContainer } from './audit-builder/audit-builder.container';

export const auditBuilderRoutes: Route[] = [
  {
    path: '',
    component: AuditBuilderContainer,
  }
];
