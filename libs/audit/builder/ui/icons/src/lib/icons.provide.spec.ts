import { TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { provideAuditBuilderIcons } from './icons.provide';
import {
  LIGHTHOUSE_BADGE_ICON_NAME,
  LIGHTHOUSE_BADGE_SVG,
  PUPPETEER_BADGE_ICON_NAME,
  PUPPETEER_BADGE_SVG,
} from './icons';

describe('provideAuditBuilderIcons', () => {
  it('registers the audit builder badge icons', () => {
    const addSvgIconLiteral = vi.fn();
    const bypassSecurityTrustHtml = vi.fn((svg: string) => svg);

    TestBed.configureTestingModule({
      providers: [
        provideAuditBuilderIcons(),
        {
          provide: MatIconRegistry,
          useValue: { addSvgIconLiteral },
        },
        {
          provide: DomSanitizer,
          useValue: { bypassSecurityTrustHtml },
        },
      ],
    });

    TestBed.inject(MatIconRegistry);

    expect(bypassSecurityTrustHtml).toHaveBeenNthCalledWith(1, LIGHTHOUSE_BADGE_SVG);
    expect(bypassSecurityTrustHtml).toHaveBeenNthCalledWith(2, PUPPETEER_BADGE_SVG);
    expect(addSvgIconLiteral).toHaveBeenNthCalledWith(1, LIGHTHOUSE_BADGE_ICON_NAME, LIGHTHOUSE_BADGE_SVG);
    expect(addSvgIconLiteral).toHaveBeenNthCalledWith(2, PUPPETEER_BADGE_ICON_NAME, PUPPETEER_BADGE_SVG);
  });
});
