import type { Meta, StoryObj } from '@storybook/angular';
import { FlowResult } from 'lighthouse';
import { ViewerStepDetailComponent } from './viewer-step-details.component';

const stepDetails = {
  name: 'Search results',
  lhr: {
    finalDisplayedUrl: 'https://app-speed.dev/search',
    entities: null,
    fullPageScreenshot: null,
    i18n: {
      rendererFormattedStrings: {
        passedAuditsGroupTitle: 'Passed audits',
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
    },
  },
} as unknown as FlowResult.Step;

const meta: Meta<ViewerStepDetailComponent> = {
  title: 'Patterns/Viewer Container/Step Details',
  component: ViewerStepDetailComponent,
  parameters: {
    layout: 'padded',
  },
  args: {
    stepDetails,
  },
};

export default meta;
type Story = StoryObj<ViewerStepDetailComponent>;

export const Default: Story = {};
