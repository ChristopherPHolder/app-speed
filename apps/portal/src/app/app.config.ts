import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { shellRoutes } from '@app-speed/portal-feature-shell';
import { provideStore } from '@ngrx/store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideZoneChangeDetection(),
    provideHttpClient(withFetch()),
    provideStore({}),
  ],
};
