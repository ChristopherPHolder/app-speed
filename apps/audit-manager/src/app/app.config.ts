import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withEnabledBlockingInitialNavigation(),
    ),
    provideAnimations(),
  ],
};