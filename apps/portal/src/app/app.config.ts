import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { AuthService, authInterceptor } from '@app-speed/platform/auth-portal';
import { shellRoutes } from './shell/shell.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideZoneChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).initialize()),
    provideStore({}),
  ],
};
