import { inject, provideEnvironmentInitializer } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const LIGHTHOUSE_BADGE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" focusable="false">
    <defs>
      <linearGradient id="lighthouse-badge-gradient" x1="4" y1="3.5" x2="24" y2="24.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff1eb" />
        <stop offset="1" stop-color="#ffe58f" />
      </linearGradient>
    </defs>
    <circle cx="14" cy="14" r="14" fill="url(#lighthouse-badge-gradient)" />
    <circle cx="14" cy="14" r="13.5" fill="none" stroke="rgba(15, 23, 42, 0.08)" />
    <g transform="translate(2 2)">
      <path d="M8 21h8l-1.45-6.2h-5.1L8 21Z" fill="#fff6e3" />
      <path d="M12 2.5 16.2 5v6.2H18v2.4h-2.35L18 21H6l2.35-7.4H6v-2.4h1.8V5L12 2.5Z" fill="#f76342" />
      <path d="M10.35 7.4h3.3v4.4h-3.3z" fill="#ffe45c" />
      <path d="M8.35 13.6h7.3" stroke="#ffb39f" stroke-linecap="round" stroke-width="1.2" />
    </g>
  </svg>
`;

const PUPPETEER_BADGE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" focusable="false">
    <defs>
      <linearGradient id="puppeteer-badge-gradient" x1="4" y1="3.5" x2="24" y2="24.5" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#e7fff2" />
        <stop offset="1" stop-color="#b7f0d4" />
      </linearGradient>
    </defs>
    <circle cx="14" cy="14" r="14" fill="url(#puppeteer-badge-gradient)" />
    <circle cx="14" cy="14" r="13.5" fill="none" stroke="rgba(15, 23, 42, 0.08)" />
    <g transform="translate(2 2)">
      <circle cx="12" cy="12" r="9.5" fill="#20b26b" />
      <path
        d="M6.2 11.1c0-2.6 1.2-5 3.1-6.5M17.8 12.9c-.5 2.9-3 5.1-6 5.1-1.6 0-3.1-.6-4.2-1.6"
        fill="none"
        stroke="rgba(255,255,255,0.78)"
        stroke-linecap="round"
        stroke-width="1.35"
      />
      <path d="m10 8.3 5.4 3.7-5.4 3.7z" fill="#ffffff" />
    </g>
  </svg>
`;

const AUDIT_BUILDER_BADGE_ICONS = {
  'lighthouse-badge': LIGHTHOUSE_BADGE_SVG,
  'puppeteer-badge': PUPPETEER_BADGE_SVG,
} as const;

export const provideAuditBuilderIcons = () =>
  provideEnvironmentInitializer(() => {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    Object.entries(AUDIT_BUILDER_BADGE_ICONS).forEach(([name, svg]) => {
      iconRegistry.addSvgIconLiteral(name, sanitizer.bypassSecurityTrustHtml(svg));
    });
  });
