import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import type { FlowResult } from 'lighthouse';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideNoopAnimations(), provideHttpClient(), provideHttpClientTesting()],
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
});
