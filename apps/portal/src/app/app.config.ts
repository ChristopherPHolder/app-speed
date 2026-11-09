import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { auditScopeInterceptor, AuditScopeRouteReuseStrategy } from './workspace/audit-scope';
import { shellRoutes } from './shell/shell.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideZoneChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([auditScopeInterceptor])),
    { provide: RouteReuseStrategy, useClass: AuditScopeRouteReuseStrategy },
    provideStore({}),
  ],
};
