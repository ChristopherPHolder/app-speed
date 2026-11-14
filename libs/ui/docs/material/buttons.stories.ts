import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Buttons are ranked by emphasis. A view has **one** filled button — its primary action — and everything else steps down.

| Variant | Emphasis | Use it for |
| --- | --- | --- |
| Filled (\`matButton="filled"\`) | Highest | The one action that completes the view: Run audit, Create project |
| Tonal (\`matButton="tonal"\`) | High | An important action that isn't the final one: Add step, Choose trace |
| Outlined (\`matButton="outlined"\`) | Medium | Secondary actions next to a filled button; neutral actions such as Sign in or Refresh |
| Text (\`matButton\`) | Low | Dialog actions, inline actions, the least important choice in a group |
| Elevated (\`matButton="elevated"\`) | Medium | Only where a button sits on a busy or tinted surface and needs separation |
| Icon (\`matIconButton\`) | Low | Compact actions in toolbars, rows and headers. Always has an \`aria-label\` |
| FAB (\`matFab\`) | Highest | The primary action of a whole screen, floating above content. Rare in this product |

**Rules**

- Labels are sentence case, start with a verb, and name the object.
- Use \`<a matButton>\` for navigation and \`<button matButton>\` for actions. Always set \`type="button"\` inside forms.
- Put the more important action on the trailing side of a group.
- Destructive actions use the error colour on an outlined or text button; never a filled red button by default.
- An icon in a button sits before the label, except arrows that show direction, which follow it.
- Don't size or recolour buttons with custom CSS. Don't build a button from a \`div\`.
`;

const meta: Meta = {
  title: 'Material/Buttons',
  decorators: [moduleMetadata({ imports: [MatButton, MatIconButton, MatFabButton, MatIcon] })],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** The variants in order of emphasis. */
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <button matButton="filled" type="button">Filled</button>
        <button matButton="tonal" type="button">Tonal</button>
        <button matButton="outlined" type="button">Outlined</button>
        <button matButton type="button">Text</button>
        <button matButton="elevated" type="button">Elevated</button>
      </div>
    `,
  }),
};

/** Leading icons clarify the action; a trailing arrow shows direction. */
export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <button matButton="filled" type="button"><mat-icon aria-hidden="true">add</mat-icon>New project</button>
        <button matButton="tonal" type="button"><mat-icon aria-hidden="true">folder_open</mat-icon>Choose trace</button>
        <button matButton="outlined" type="button"><mat-icon aria-hidden="true">refresh</mat-icon>Refresh</button>
        <a matButton href="#" (click)="$event.preventDefault()">View history<mat-icon iconPositionEnd aria-hidden="true">arrow_forward</mat-icon></a>
      </div>
    `,
  }),
};

/** Icon buttons and a FAB. Each icon-only control has an accessible name. */
export const IconButtons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
        <button matIconButton type="button" aria-label="Copy audit ID"><mat-icon>content_copy</mat-icon></button>
        <button matIconButton type="button" aria-label="More actions"><mat-icon>more_vert</mat-icon></button>
        <button matFab type="button" aria-label="New audit"><mat-icon>add</mat-icon></button>
      </div>
    `,
  }),
};

/** One primary action per group, on the trailing side. */
export const Hierarchy: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; max-width: 480px;">
        <button matButton type="button">Cancel</button>
        <button matButton="outlined" type="button">Save draft</button>
        <button matButton="filled" type="button">Run audit</button>
      </div>
    `,
  }),
};

/** Destructive actions use the error role without becoming the loudest thing on the page. */
export const Destructive: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px;">
        <button matButton="outlined" type="button" style="--mat-button-outlined-label-text-color: var(--mat-sys-error);">Delete project</button>
        <button matButton type="button" style="--mat-button-text-label-text-color: var(--mat-sys-error);">Remove member</button>
      </div>
    `,
  }),
};
