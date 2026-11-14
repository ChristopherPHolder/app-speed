import { MatAnchor, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import {
  PageHeaderActionsDirective,
  PageHeaderAsideDirective,
  PageHeaderComponent,
  PageHeaderNavigationDirective,
} from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Components/Page header',
  component: PageHeaderComponent,
  decorators: [
    moduleMetadata({
      imports: [
        PageHeaderActionsDirective,
        PageHeaderAsideDirective,
        PageHeaderNavigationDirective,
        MatButton,
        MatAnchor,
        MatIcon,
      ],
    }),
  ],
  args: {
    heading: 'Audit history',
    description: 'Your audit runs, progress and results.',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The title block of a page and the only place its `h1` is rendered. Every routed page has one. ' +
          'Project a back link or breadcrumbs with `uiPageHeaderNavigation` and page-level actions with ' +
          '`uiPageHeaderActions`. Use `prominence="hero"` for landing-style pages: it sets the header on a tonal ' +
          'panel with display type and accepts supporting content through `uiPageHeaderAside`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {};

export const WithEyebrow: Story = {
  args: { eyebrow: 'Trace tool', heading: 'Trace filmstrip', description: 'Inspect captured frames and export them.' },
};

/** Page-level actions sit beside the heading and wrap under it in compact windows. */
export const WithActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-page-header [heading]="heading" [description]="description">
        <button uiPageHeaderActions matButton="outlined" type="button">
          <mat-icon aria-hidden="true">refresh</mat-icon>Refresh
        </button>
      </ui-page-header>
    `,
  }),
};

/** A back link above the heading. */
export const WithNavigation: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-page-header eyebrow="Trace tool" heading="Trace filmstrip" [description]="description">
        <a uiPageHeaderNavigation matButton href="#" (click)="$event.preventDefault()" style="margin: 0 0 16px -12px;">
          <mat-icon aria-hidden="true">arrow_back</mat-icon>All tools
        </a>
      </ui-page-header>
    `,
  }),
};

/** Hero prominence for a landing-style page. */
export const Hero: Story = {
  render: () => ({
    template: `
      <ui-page-header
        prominence="hero"
        eyebrow="Web performance toolkit"
        heading="Measure, understand, and improve app speed"
        description="Run repeatable user-flow audits, follow results over time, and turn browser traces into useful visuals."
      >
        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
          <a matButton="filled" href="#" (click)="$event.preventDefault()">Run a user-flow audit</a>
          <a matButton="outlined" href="#" (click)="$event.preventDefault()">View audit history</a>
        </div>
      </ui-page-header>
    `,
  }),
};

/** A hero with supporting content beside it from the expanded window class. */
export const HeroWithAside: Story = {
  render: () => ({
    template: `
      <ui-page-header
        prominence="hero"
        eyebrow="Local trace utilities"
        heading="Turn a Chrome trace into useful visuals"
        description="Extract screenshots, build a filmstrip, or compare two timelines in your browser."
      >
        <div uiPageHeaderAside style="display: grid; gap: 8px;">
          <div style="padding: 12px 16px; border-radius: var(--mat-sys-corner-large); background: var(--mat-sys-surface);">Drop a trace</div>
          <div style="padding: 12px 16px; border-radius: var(--mat-sys-corner-large); background: var(--mat-sys-surface);">Choose a workflow</div>
          <div style="padding: 12px 16px; border-radius: var(--mat-sys-corner-large); background: var(--mat-sys-surface);">Export locally</div>
        </div>
      </ui-page-header>
    `,
  }),
};
