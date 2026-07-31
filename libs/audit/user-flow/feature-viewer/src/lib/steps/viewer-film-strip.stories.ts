import type { Meta, StoryObj } from '@storybook/angular';
import { ViewerFilmStripComponent } from './viewer-film-strip.component';

const frameDataUri = (label: string, background: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100" viewBox="0 0 180 100">
      <rect width="180" height="100" rx="12" fill="${background}" />
      <rect x="14" y="14" width="152" height="12" rx="6" fill="rgba(255,255,255,0.45)" />
      <rect x="14" y="36" width="112" height="10" rx="5" fill="rgba(255,255,255,0.7)" />
      <rect x="14" y="78" width="72" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      <text x="14" y="66" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="700">${label}</text>
    </svg>`,
  )}`;

const meta: Meta<ViewerFilmStripComponent> = {
  title: 'Patterns/Viewer /Film Strip',
  component: ViewerFilmStripComponent,
  parameters: {
    layout: 'padded',
  },
  args: {
    filmStrip: [
      { data: frameDataUri('Homepage', '#1f5f8b') },
      { data: frameDataUri('Search', '#3b7a57') },
      { data: frameDataUri('Product', '#9b5c2e') },
      { data: frameDataUri('Cart', '#7a3e8e') },
      { data: frameDataUri('Checkout', '#b6485d') },
    ],
  },
};

export default meta;
type Story = StoryObj<ViewerFilmStripComponent>;

export const Default: Story = {};
