import type { Meta, StoryObj } from '@storybook/angular';
import { AuditRunDetailsComponent } from './audit-run-details.component';
import { AuditRunSummary } from '../api/audit-runs.models';

const completedRun: AuditRunSummary = {
  auditId: 'audit-003',
  title: 'Search journey regression audit',
  status: 'COMPLETE',
  resultStatus: 'SUCCESS',
  queuePosition: null,
  createdAt: '2026-03-07T06:30:00.000Z',
  startedAt: '2026-03-07T06:32:00.000Z',
  completedAt: '2026-03-07T06:33:18.000Z',
  durationMs: 78000,
};

const inProgressRun: AuditRunSummary = {
  auditId: 'audit-002',
  title: 'Checkout flow accessibility audit',
  status: 'IN_PROGRESS',
  resultStatus: null,
  queuePosition: null,
  createdAt: '2026-03-07T07:42:00.000Z',
  startedAt: '2026-03-07T07:45:00.000Z',
  completedAt: null,
  durationMs: null,
};

const meta: Meta<AuditRunDetailsComponent> = {
  title: 'Patterns/Audit Runs/Details',
  component: AuditRunDetailsComponent,
  args: {
    run: completedRun,
    loading: false,
    errorMessage: null,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<AuditRunDetailsComponent>;

export const Complete: Story = {};

export const InProgress: Story = {
  args: {
    run: inProgressRun,
  },
};

export const Loading: Story = {
  args: {
    run: null,
    loading: true,
  },
};

export const Error: Story = {
  args: {
    run: null,
    errorMessage: 'Unable to load run details.',
  },
};
