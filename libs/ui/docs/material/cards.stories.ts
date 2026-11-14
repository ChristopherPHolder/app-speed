import { MatButton } from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
A card groups content and actions about **one** subject. If the content isn't a discrete, self-contained thing, it
doesn't need a card — use spacing, a divider or a surface container.

| Appearance | Use it for |
| --- | --- |
| Outlined (\`appearance="outlined"\`) | The default. Cards on the page surface |
| Filled (\`appearance="filled"\`) | Cards that need less emphasis than their surroundings, or that sit on \`surface\` without a border |
| Raised (\`appearance="raised"\`) | A card on a tinted or image background that needs lifting. Rare |

**Rules**

- Don't nest cards. A card inside a card is a sign the outer one should be a page section.
- Don't wrap an entire page or form in a single card just to give it a border.
- A card that navigates is one link: the whole surface is the target and shows a state layer (see States). Don't put
  other interactive controls inside it.
- Padding is 16dp, or 24dp for large cards from the medium window class.
- Titles use \`title-medium\` or \`title-large\`; supporting text uses \`body-medium\` in \`on-surface-variant\`.
- Actions sit at the bottom, aligned to the end, with the primary action last.
`;

const meta: Meta = {
  title: 'Material/Cards',
  decorators: [
    moduleMetadata({
      imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatButton],
    }),
  ],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

const card = (appearance: string) => `
  <mat-card appearance="${appearance}" style="max-width: 320px;">
    <mat-card-header>
      <mat-card-title>Checkout journey</mat-card-title>
      <mat-card-subtitle>User flow · 3 steps</mat-card-subtitle>
    </mat-card-header>
    <mat-card-content>
      <p style="margin: 16px 0 0;">Last run succeeded in 21.8 s on a mobile device.</p>
    </mat-card-content>
    <mat-card-actions align="end">
      <button matButton type="button">Open</button>
      <button matButton="tonal" type="button">Run again</button>
    </mat-card-actions>
  </mat-card>
`;

/** Outlined, filled and raised. */
export const Appearances: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 320px)); gap: 16px;">
        ${card('outlined')} ${card('filled')} ${card('raised')}
      </div>
    `,
  }),
};
