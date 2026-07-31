import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';

import { AuditSummaryComponent, fitScreenshotPreview } from './audit-summary.component';

describe('AuditSummaryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: BreakpointObserver,
          useValue: { isMatched: vi.fn(() => false) },
        },
      ],
    }).compileComponents();
  });

  it('lets Swiper move clicked step snapshots into view', () => {
    const component = TestBed.runInInjectionContext(() => new AuditSummaryComponent());

    expect(component.swiperConfig().slideToClickedSlide).toBe(true);
  });

  it('preserves desktop and mobile screenshot aspect ratios in the preview', () => {
    expect(fitScreenshotPreview(1920, 1080)).toEqual({ width: 250, height: 140.625 });
    expect(fitScreenshotPreview(360, 720)).toEqual({ width: 125, height: 250 });
  });
});
