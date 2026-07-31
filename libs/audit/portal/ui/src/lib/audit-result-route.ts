import { InjectionToken } from '@angular/core';
import type { NavigationExtras } from '@angular/router';

export type AuditResultRoute = (auditId: string) => { commands: ReadonlyArray<string>; extras?: NavigationExtras };

export const AUDIT_RESULT_ROUTE = new InjectionToken<AuditResultRoute>('AUDIT_RESULT_ROUTE');
