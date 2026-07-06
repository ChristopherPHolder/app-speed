import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';

import { AuditSummaryComponent } from './audit-summary.component';

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
});
