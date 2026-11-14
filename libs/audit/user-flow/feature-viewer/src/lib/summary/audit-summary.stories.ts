import type { Meta, StoryObj } from '@storybook/angular';
import { AuditSummaryComponent } from './audit-summary.component';

const meta: Meta<AuditSummaryComponent> = {
  title: 'Patterns/Audit Summary',
  component: AuditSummaryComponent,
};

export default meta;
type Story = StoryObj<AuditSummaryComponent>;

const DUMMY_IMG = 'data:image/gif;base64,R0lGODdhAQADAPABAP////8AACwAAAAAAQADAAACAgxQADs=';
export const MultiStep: Story = {
  args: {
    auditSummary: [
      {
        screenShot: DUMMY_IMG,
        screenShotSize: { width: 250, height: 140.625 },
        title: 'Audit Title',
        subTitle: 'Step',
        shouldDisplayAsFraction: false,
        categoryScores: [
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
        ],
      },
      {
        screenShot: DUMMY_IMG,
        screenShotSize: { width: 125, height: 250 },
        title: 'Audit Title',
        subTitle: 'Step',
        shouldDisplayAsFraction: true,
        categoryScores: [
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
        ],
      },
      {
        screenShot: DUMMY_IMG,
        screenShotSize: { width: 250, height: 140.625 },
        title: 'Audit Title',
        subTitle: 'Step',
        shouldDisplayAsFraction: false,
        categoryScores: [
          {
            name: 'test',
            asFraction: {
              numPassed: 1,
              numPassableAudits: 1,
              numInformative: 1,
              totalWeight: 1,
            },
            score: 1,
          },
        ],
      },
    ],
  },
};

/** A full-height first slide exposes selection outlines clipped by Swiper. Check at 390px too. */
export const PortraitFirst: Story = {
  args: {
    auditSummary: [MultiStep.args!.auditSummary![1], MultiStep.args!.auditSummary![0]].map((step) => ({
      ...step,
      shouldDisplayAsFraction: false,
      categoryScores: [
        { ...step.categoryScores[0], name: 'Performance', score: 60 },
        { ...step.categoryScores[0], name: 'Accessibility', score: 97 },
        { ...step.categoryScores[0], name: 'Best Practices', score: 77 },
        { ...step.categoryScores[0], name: 'SEO', score: 100 },
        { ...step.categoryScores[0], name: 'Agentic Browsing', score: 75 },
      ],
    })),
  },
};
