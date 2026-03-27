import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { shellRoutes } from './shell/shell.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideZoneChangeDetection(),
    provideHttpClient(withFetch()),
    provideStore({}),
  ],
};
