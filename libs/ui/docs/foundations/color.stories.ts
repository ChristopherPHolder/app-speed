import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { TokenValueComponent } from '../token-value.component';

type Role = { token: string; on: string; label: string };
type RoleGroup = { title: string; roles: Role[] };

const role = (name: string, on: string, prefix = '--mat-sys-'): Role => ({
  token: `${prefix}${name}`,
  on: `${prefix}${on}`,
  label: name,
});

const accentGroups: RoleGroup[] = ['primary', 'secondary', 'tertiary', 'error'].map((name) => ({
  title: name,
  roles: [
    role(name, `on-${name}`),
    role(`on-${name}`, name),
    role(`${name}-container`, `on-${name}-container`),
    role(`on-${name}-container`, `${name}-container`),
  ],
}));

const surfaceGroups: RoleGroup[] = [
  {
    title: 'Surface containers',
    roles: [
      'surface-container-lowest',
      'surface-container-low',
      'surface-container',
      'surface-container-high',
      'surface-container-highest',
    ].map((name) => role(name, 'on-surface')),
  },
  {
    title: 'Surface',
    roles: [
      role('surface-dim', 'on-surface'),
      role('surface', 'on-surface'),
      role('surface-bright', 'on-surface'),
      role('on-surface', 'surface'),
      role('on-surface-variant', 'surface'),
    ],
  },
  {
    title: 'Outline and inverse',
    roles: [
      role('outline', 'surface'),
      role('outline-variant', 'on-surface'),
      role('inverse-surface', 'inverse-on-surface'),
      role('inverse-on-surface', 'inverse-surface'),
      role('inverse-primary', 'inverse-surface'),
    ],
  },
];

const statusGroups: RoleGroup[] = ['success', 'warning'].map((name) => ({
  title: name,
  roles: [
    role(name, `on-${name}`, '--ui-'),
    role(`on-${name}`, name, '--ui-'),
    role(`${name}-container`, `on-${name}-container`, '--ui-'),
    role(`on-${name}-container`, `${name}-container`, '--ui-'),
  ],
}));

const swatches = `
  <div style="display: grid; gap: 24px; padding: 24px;">
    @for (group of groups; track group.title) {
      <section>
        <h3 style="margin: 0 0 8px; font: var(--mat-sys-title-small); text-transform: capitalize;">{{ group.title }}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
          @for (role of group.roles; track role.token) {
            <div
              style="display: grid; gap: 24px; padding: 12px; border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--mat-sys-corner-medium);"
              [style.background]="'var(' + role.token + ')'"
              [style.color]="'var(' + role.on + ')'"
            >
              <span style="font: var(--mat-sys-label-large);">{{ role.label }}</span>
              <span style="display: grid; gap: 2px; font: var(--mat-sys-body-small);">
                <code>{{ role.token }}</code>
                <ui-docs-token-value [token]="role.token" kind="color" />
              </span>
            </div>
          }
        </div>
      </section>
    }
  </div>
`;

const meta: Meta = {
  title: 'Foundations/Color',
  tags: ['!autodocs'],
  decorators: [moduleMetadata({ imports: [TokenValueComponent] })],
};

export default meta;
type Story = StoryObj;

/** Accent roles. Each fill is shown with the content colour it pairs with. */
export const AccentRoles: Story = {
  render: () => ({ props: { groups: accentGroups }, template: swatches }),
};

/** Surfaces, outlines and the inverse roles. */
export const SurfaceRoles: Story = {
  render: () => ({ props: { groups: surfaceGroups }, template: swatches }),
};

/** Extended roles for status. Error status uses the built-in error roles. */
export const StatusRoles: Story = {
  render: () => ({ props: { groups: statusGroups }, template: swatches }),
};

/** Score accents are graphics, with readable status text alongside them. */
export const ScoreAccents: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--ui-space-6); padding: var(--ui-space-6);">
        @for (band of bands; track band.name) {
          <div [style.color]="'var(' + band.text + ')'" style="display: grid; gap: var(--ui-space-2);">
            <svg viewBox="0 0 100 100" width="50" height="50" aria-hidden="true">
              <circle cx="50" cy="50" r="45" fill="none" stroke-width="8" [attr.stroke]="'var(' + band.accent + ')'" />
            </svg>
            <span>{{ band.name }}</span>
            <code>{{ band.accent }}</code>
          </div>
        }
      </div>
    `,
    props: {
      bands: [
        { name: 'Good', accent: '--ui-score-good', text: '--ui-success' },
        { name: 'Needs improvement', accent: '--ui-score-average', text: '--ui-warning' },
        { name: 'Poor', accent: '--ui-score-poor', text: '--mat-sys-error' },
      ],
    },
  }),
};
