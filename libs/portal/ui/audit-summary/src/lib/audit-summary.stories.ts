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
