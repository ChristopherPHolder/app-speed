import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { MatToolbar } from '@angular/material/toolbar';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
Navigation adapts to the window size class. The destinations stay the same; only the container changes.

| Window class | Signed out | Signed in |
| --- | --- | --- |
| Compact, medium | Top app bar with a menu button that opens a **modal drawer** | Same |
| Expanded and up | Top app bar with inline destinations | **Standard drawer** with the workspace switcher, projects and tools |

**Rules**

- Three to five top-level destinations. More than that belongs in a drawer with groups.
- The current destination is always marked: a \`secondary-container\` indicator plus \`aria-current="page"\`. It stays
  marked on child routes and when the URL carries query parameters.
- Destinations are nouns or short verb phrases in sentence case, each with a consistent icon in drawers.
- The top app bar holds the brand, navigation and account actions — not page-specific actions. Those go in the page
  header.
- A modal drawer closes on selection, on \`Escape\` and on scrim click, and returns focus to the menu button.
- Give each \`<nav>\` a distinct \`aria-label\`.
- Breadcrumbs show position inside a workspace; a single "back" link is enough for one level.
- Don't hide the app bar on scroll; the pages are short and the bar carries sign-in.
`;

const meta: Meta = {
  title: 'Material/Navigation',
  decorators: [
    moduleMetadata({
      imports: [
        MatToolbar,
        MatButton,
        MatIconButton,
        MatIcon,
        MatNavList,
        MatListItem,
        MatListItemIcon,
        MatListItemTitle,
      ],
    }),
  ],
  parameters: { docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** Top app bar with inline destinations, for expanded windows. */
export const TopAppBar: Story = {
  render: () => ({
    template: `
      <mat-toolbar style="gap: 8px; background: var(--mat-sys-surface); border-bottom: 1px solid var(--mat-sys-outline-variant);">
        <strong style="margin-inline-end: 16px; font: var(--mat-sys-title-large);">App Speed</strong>
        <nav aria-label="Primary navigation" style="display: flex; gap: 4px;">
          <a matButton href="#" (click)="$event.preventDefault()" style="color: var(--mat-sys-on-surface-variant);">Run audit</a>
          <a matButton href="#" aria-current="page" (click)="$event.preventDefault()" style="background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container);">Audit history</a>
          <a matButton href="#" (click)="$event.preventDefault()" style="color: var(--mat-sys-on-surface-variant);">Trace tools</a>
        </nav>
        <span style="flex: 1;"></span>
        <button matButton="outlined" type="button">Sign in</button>
      </mat-toolbar>
    `,
  }),
};

/** Compact app bar: a menu button opens the drawer. */
export const CompactAppBar: Story = {
  render: () => ({
    template: `
      <mat-toolbar style="max-width: 390px; gap: 4px; background: var(--mat-sys-surface); border-bottom: 1px solid var(--mat-sys-outline-variant);">
        <button matIconButton type="button" aria-label="Open navigation menu"><mat-icon>menu</mat-icon></button>
        <strong style="font: var(--mat-sys-title-large);">App Speed</strong>
        <span style="flex: 1;"></span>
        <button matButton="outlined" type="button">Sign in</button>
      </mat-toolbar>
    `,
  }),
};

/** Drawer content: grouped destinations with the current one activated. */
export const Drawer: Story = {
  render: () => ({
    template: `
      <div style="width: 280px; padding: 12px; box-sizing: border-box; background: var(--mat-sys-surface-container-low);">
        <p style="margin: 8px 16px 0; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-medium);">Audit tools</p>
        <mat-nav-list aria-label="Audit tools">
          <a mat-list-item href="#" (click)="$event.preventDefault()">
            <mat-icon matListItemIcon>speed</mat-icon><span matListItemTitle>Run audit</span>
          </a>
          <a mat-list-item href="#" [activated]="true" aria-current="page" (click)="$event.preventDefault()">
            <mat-icon matListItemIcon>history</mat-icon><span matListItemTitle>Audit history</span>
          </a>
          <a mat-list-item href="#" (click)="$event.preventDefault()">
            <mat-icon matListItemIcon>construction</mat-icon><span matListItemTitle>Trace tools</span>
          </a>
        </mat-nav-list>
      </div>
    `,
  }),
};
