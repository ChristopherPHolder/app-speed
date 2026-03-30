import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from './icons.provide';
import { LIGHTHOUSE_BADGE_ICON_NAME, PUPPETEER_BADGE_ICON_NAME } from './icons';

@Component({
  selector: 'b-ui-audit-builder-icon-gallery',
  imports: [MatIconModule],
  template: `
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
      <div style="display: grid; gap: 8px; justify-items: center;">
        <mat-icon svgIcon="'lighthouse-badge'" style="width: 56px; height: 56px; font-size: 56px;" />
        <span>lighthouse-badge</span>
      </div>

      <div style="display: grid; gap: 8px; justify-items: center;">
        <mat-icon svgIcon="puppeteer-badge" style="width: 56px; height: 56px; font-size: 56px;" />
        <span>puppeteer-badge</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AuditBuilderIconGalleryComponent {}

const meta: Meta<AuditBuilderIconGalleryComponent> = {
  title: 'Patterns/Audit Builder/Icons',
  component: AuditBuilderIconGalleryComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<AuditBuilderIconGalleryComponent>;

export const Default: Story = {
  render: () => ({
    props: {
      lighthouseBadgeIconName: LIGHTHOUSE_BADGE_ICON_NAME,
      puppeteerBadgeIconName: PUPPETEER_BADGE_ICON_NAME,
    },
  }),
};
