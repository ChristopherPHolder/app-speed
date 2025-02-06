import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { shellRoutes } from '@app-speed/portal-feature-shell';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(shellRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
  ],
};
