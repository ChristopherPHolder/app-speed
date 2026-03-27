import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, beforeEach, expect, it } from 'vitest';
import { FlowResult } from 'lighthouse';
import { ViewerStepDetailComponent } from './viewer-step-details.component';

const rendererFormattedStrings = {
  passedAuditsGroupTitle: 'Passed audits',
  warningAuditsGroupTitle: 'Passed audits but with warnings',
  manualAuditsGroupTitle: 'Additional items to manually check',
  notApplicableAuditsGroupTitle: 'Not applicable',
};

const multiCategoryStep = {
  name: 'Search results',
  lhr: {
    finalDisplayedUrl: 'https://app-speed.dev/search',
    entities: null,
    fullPageScreenshot: null,
    i18n: {
      rendererFormattedStrings,
    },
    categoryGroups: {
      diagnostics: {
        title: 'Diagnostics',
        description: 'Actionable diagnostics for the current page state.',
      },
      'a11y-names-labels': {
        title: 'Names and labels',
        description: 'Review accessible names and form labels.',
      },
      'seo-content': {
        title: 'Content Best Practices',
        description: 'Help search engines understand the page content.',
      },
    },
    categories: {
      performance: {
        title: 'Performance',
        score: 0.82,
        auditRefs: [
          {
            id: 'first-contentful-paint',
            weight: 10,
            group: 'metrics',
            acronym: 'FCP',
          },
          {
            id: 'render-blocking-resources',
            weight: 3,
            group: 'diagnostics',
          },
          {
            id: 'uses-text-compression',
            weight: 1,
            group: 'diagnostics',
          },
        ],
      },
      accessibility: {
        title: 'Accessibility',
        score: 0.74,
        auditRefs: [
          {
            id: 'image-alt',
            weight: 10,
            group: 'a11y-names-labels',
          },
          {
            id: 'label',
            weight: 7,
            group: 'a11y-names-labels',
          },
        ],
      },
      seo: {
        title: 'SEO',
        score: 0.5,
        auditRefs: [
          {
            id: 'document-title',
            weight: 10,
            group: 'seo-content',
          },
        ],
      },
    },
    audits: {
      'first-contentful-paint': {
        id: 'first-contentful-paint',
        title: 'First Contentful Paint',
        description: 'Marks the time when the first text or image is painted.',
        displayValue: '1.1 s',
        score: 0.92,
        scoreDisplayMode: 'numeric',
      },
      'render-blocking-resources': {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Some stylesheet requests are delaying the initial render.',
        displayValue: 'Potential savings of 210 ms',
        score: 0.44,
        scoreDisplayMode: 'numeric',
      },
      'uses-text-compression': {
        id: 'uses-text-compression',
        title: 'Enable text compression',
        description: 'Text-based responses are already served with compression.',
        displayValue: 'Passed',
        score: 1,
        scoreDisplayMode: 'binary',
      },
      'image-alt': {
        id: 'image-alt',
        title: 'Image elements have `[alt]` attributes',
        description: 'Informative elements should aim for short, descriptive alternate text.',
        score: 0,
        scoreDisplayMode: 'binary',
      },
      label: {
        id: 'label',
        title: 'Form elements have associated labels',
        description: 'Labels ensure that form controls are announced properly by assistive technologies.',
        score: 1,
        scoreDisplayMode: 'binary',
      },
      'document-title': {
        id: 'document-title',
        title: 'Document has a `<title>` element',
        description: 'Search engines use the title to understand your page topic.',
        score: 0,
        scoreDisplayMode: 'binary',
      },
    },
  },
} as unknown as FlowResult.Step;

const accessibilityOnlyStep = {
  name: 'Accessibility only',
  lhr: {
    finalDisplayedUrl: 'https://app-speed.dev/accessibility',
    entities: null,
    fullPageScreenshot: null,
    i18n: {
      rendererFormattedStrings,
    },
    categoryGroups: {
      'a11y-names-labels': {
        title: 'Names and labels',
      },
    },
    categories: {
      accessibility: {
        title: 'Accessibility',
        score: 0.5,
        auditRefs: [
          {
            id: 'image-alt',
            weight: 10,
            group: 'a11y-names-labels',
          },
        ],
      },
    },
    audits: {
      'image-alt': {
        id: 'image-alt',
        title: 'Image elements have `[alt]` attributes',
        description: 'Informative elements should aim for short, descriptive alternate text.',
        score: 0,
        scoreDisplayMode: 'binary',
      },
    },
  },
} as unknown as FlowResult.Step;

describe('ViewerStepDetailComponent', () => {
  let component: ViewerStepDetailComponent;
  let fixture: ComponentFixture<ViewerStepDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewerStepDetailComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewerStepDetailComponent);
    component = fixture.componentInstance;
  });

  it('builds sections for non-performance Lighthouse categories', () => {
    fixture.componentRef.setInput('stepDetails', multiCategoryStep);
    fixture.detectChanges();

    expect(component.categoryViews().map((category) => category.title)).toEqual(
      expect.arrayContaining(['Performance', 'Accessibility', 'SEO']),
    );
    expect(component.categoryViews().find((category) => category.id === 'performance')?.metricSummary).toHaveLength(1);
    expect(component.categoryViews().find((category) => category.id === 'accessibility')?.sections.map((section) => section.title)).toEqual(
      expect.arrayContaining(['Accessibility: Names and labels']),
    );
    expect(component.categoryViews().find((category) => category.id === 'seo')?.sections.map((section) => section.title)).toEqual(
      ['SEO: Content Best Practices'],
    );
  });

  it('does not require a performance category to render category sections', () => {
    fixture.componentRef.setInput('stepDetails', accessibilityOnlyStep);
    fixture.detectChanges();

    expect(component.categoryViews().map((category) => category.title)).toEqual(['Accessibility']);
    expect(component.categoryViews()[0]?.metricSummary).toEqual([]);
    expect(component.categoryViews()[0]?.sections.map((section) => section.title)).toEqual(['Accessibility: Names and labels']);
  });
});
