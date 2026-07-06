import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import type { FlowResult } from 'lighthouse';
import { BehaviorSubject } from 'rxjs';
import { AuditViewerContainer } from './audit-viewer.container';

@Component({
  standalone: true,
  imports: [AuditViewerContainer],
  template: ` <viewer-container [auditId]="auditId" /> `,
})
class TestHostComponent {
  auditId = 'run-123';
}

const successfulResult = {
  steps: [
    {
      name: 'Home page',
      lhr: {
        gatherMode: 'navigation',
        fullPageScreenshot: null,
        categoryGroups: {},
        categories: {
          performance: {
            title: 'Performance',
            score: 0.92,
            auditRefs: [],
          },
        },
        audits: {},
      },
    },
  ],
} as unknown as FlowResult;

describe('AuditViewerContainer', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let http: HttpTestingController;
  let fragment$: BehaviorSubject<string | null>;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    fragment$ = new BehaviorSubject<string | null>(null);
    navigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { fragment: fragment$.asObservable() },
        },
        {
          provide: Router,
          useValue: { navigate },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('shows a loading indicator until the audit result is rendered', async () => {
    await fixture.whenStable();

    const request = http.expectOne('/api/audit/run-123/result');
    expect(request.request.method).toBe('GET');
    expect(fixture.nativeElement.textContent).toContain('Loading audit results...');
    expect(fixture.nativeElement.querySelector('[data-testid="audit-results-loading"]')?.getAttribute('role')).toBe(
      'status',
    );

    request.flush({ status: 'SUCCESS', result: successfulResult });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[data-testid="audit-results-loading"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Home page');
  });

  it('selects the step encoded in the URL fragment once results load', async () => {
    fragment$.next('step-2');
    await fixture.whenStable();

    const request = http.expectOne('/api/audit/run-123/result');
    request.flush({
      status: 'SUCCESS',
      result: {
        steps: [
          successfulResult.steps[0],
          {
            ...successfulResult.steps[0],
            name: 'Checkout page',
          },
        ],
      },
    });
    await fixture.whenStable();

    const container = fixture.debugElement.query(By.directive(AuditViewerContainer)).componentInstance as AuditViewerContainer;
    expect(container.activeIndex()).toBe(1);
  });

  it('writes the visible step to the URL fragment', async () => {
    await fixture.whenStable();

    const request = http.expectOne('/api/audit/run-123/result');
    request.flush({
      status: 'SUCCESS',
      result: {
        steps: [
          successfulResult.steps[0],
          {
            ...successfulResult.steps[0],
            name: 'Checkout page',
          },
        ],
      },
    });
    await fixture.whenStable();

    const container = fixture.debugElement.query(By.directive(AuditViewerContainer)).componentInstance as AuditViewerContainer;
    container.activeIndex.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(navigate).toHaveBeenLastCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      fragment: 'step-2',
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  });
});
