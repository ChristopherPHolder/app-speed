import { inject, provideEnvironmentInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
  LIGHTHOUSE_BADGE_ICON_NAME,
  LIGHTHOUSE_BADGE_SVG,
  PUPPETEER_BADGE_ICON_NAME,
  PUPPETEER_BADGE_SVG,
} from './icons';

const AUDIT_BUILDER_BADGE_ICONS = [
  [LIGHTHOUSE_BADGE_ICON_NAME, LIGHTHOUSE_BADGE_SVG],
  [PUPPETEER_BADGE_ICON_NAME, PUPPETEER_BADGE_SVG],
] as const;

export const provideAuditBuilderIcons = () =>
  provideEnvironmentInitializer(() => {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    AUDIT_BUILDER_BADGE_ICONS.forEach(([name, svg]) => {
      iconRegistry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
    });
  });
