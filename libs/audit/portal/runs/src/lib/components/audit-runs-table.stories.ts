import type { Meta, StoryObj } from '@storybook/angular';
import { AuditRunsTableComponent } from './audit-runs-table.component';
import { AuditRunSummary, DEFAULT_AUDIT_RUN_FILTER } from '../api/audit-runs.models';

const sampleRuns: ReadonlyArray<AuditRunSummary> = [
  {
    auditId: 'audit-001',
    title: 'Homepage performance audit',
    status: 'SCHEDULED',
    resultStatus: null,
    queuePosition: 1,
    createdAt: '2026-03-07T08:00:00.000Z',
    startedAt: null,
    completedAt: null,
    durationMs: null,
  },
  {
    auditId: 'audit-002',
    title: 'Checkout flow accessibility audit',
    status: 'IN_PROGRESS',
    resultStatus: null,
    queuePosition: null,
    createdAt: '2026-03-07T07:42:00.000Z',
    startedAt: '2026-03-07T07:45:00.000Z',
    completedAt: null,
    durationMs: null,
  },
  {
    auditId: 'audit-003',
    title: 'Search journey regression audit',
    status: 'COMPLETE',
    resultStatus: 'SUCCESS',
    queuePosition: null,
    createdAt: '2026-03-07T06:30:00.000Z',
    startedAt: '2026-03-07T06:32:00.000Z',
    completedAt: '2026-03-07T06:33:18.000Z',
    durationMs: 78000,
  },
];

const meta: Meta<AuditRunsTableComponent> = {
  title: 'Patterns/Audit Runs/Table',
  component: AuditRunsTableComponent,
  args: {
    runs: sampleRuns,
    loading: false,
    errorMessage: null,
    activeStatuses: [...DEFAULT_AUDIT_RUN_FILTER],
    hasPreviousPage: false,
    hasNextPage: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<AuditRunsTableComponent>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    runs: [],
    hasNextPage: false,
  },
};

export const Error: Story = {
  args: {
    errorMessage: 'Unable to load audit runs. Please try again.',
  },
};
