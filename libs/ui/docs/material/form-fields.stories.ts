import { MatError, MatFormField, MatHint, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

const guidance = `
This product uses **outlined** text fields (\`appearance="outline"\`). Don't mix in filled fields.

**Labels and help**

- Every field has a visible \`<mat-label>\` in sentence case. A placeholder is an example, never the label.
- Mark what's optional rather than what's required when most fields are required.
- Put units in the label or as a suffix: "Timeout (ms)".
- Use \`<mat-hint>\` for guidance that's always useful and \`<mat-error>\` for what's wrong and how to fix it. They share
  the same line, so keep both short.

**Layout**

- One column in compact windows. Two columns from the medium class only for short, related fields.
- Size a field to its expected content. A two-digit number doesn't need the full row; a URL does.
- Leave 16dp between fields; group related fields under a \`title-medium\` heading.
- Don't override field colours, borders or shape. Use the tokens the theme provides.

**Choosing a control**

| Choice | Control |
| --- | --- |
| Free text or a number | Text field |
| One of 2–5 options, all visible | Radio group or single-select chips |
| One of many | Select, or autocomplete past ~15 options |
| Several of a few | Checkboxes or multi-select chips |
| On / off, applied immediately | Switch |
| On / off, applied on submit | Checkbox |

**Validation**

- Validate on blur or on submit, not on every keystroke.
- Keep the submit button enabled where possible and explain what's missing next to it.
`;

const meta: Meta = {
  title: 'Material/Form fields',
  decorators: [
    moduleMetadata({
      imports: [
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatHint,
        MatError,
        MatPrefix,
        MatSuffix,
        MatInput,
        MatSelect,
        MatOption,
        MatIcon,
        MatCheckbox,
        MatSlideToggle,
      ],
    }),
  ],
  parameters: { layout: 'padded', docs: { description: { component: guidance } } },
};

export default meta;
type Story = StoryObj;

/** Outlined fields with a label, a hint and a suffix. */
export const TextFields: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; max-width: 480px;">
        <mat-form-field appearance="outline">
          <mat-label>Audit title</mat-label>
          <input matInput placeholder="Checkout journey" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Timeout</mat-label>
          <input matInput type="number" value="30000" />
          <span matTextSuffix>ms</span>
          <mat-hint>Between 1 and 99999</mat-hint>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-icon matPrefix aria-hidden="true">search</mat-icon>
          <mat-label>Search audits</mat-label>
          <input matInput type="search" />
        </mat-form-field>
      </div>
    `,
  }),
};

/** An error replaces the hint and says how to fix the problem. */
export const Validation: Story = {
  render: () => {
    const title = new FormControl('', { validators: [Validators.required] });
    title.markAsTouched();
    return {
      props: { title },
      template: `
        <mat-form-field appearance="outline" style="width: min(100%, 480px);">
          <mat-label>Audit title</mat-label>
          <input matInput [formControl]="title" />
          <mat-error>Enter a title for this audit.</mat-error>
        </mat-form-field>
      `,
    };
  },
};

/** Select, checkbox and switch. */
export const SelectionControls: Story = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 16px; max-width: 480px;">
        <mat-form-field appearance="outline">
          <mat-label>Device type</mat-label>
          <mat-select value="mobile">
            <mat-option value="mobile">Mobile</mat-option>
            <mat-option value="tablet">Tablet</mat-option>
            <mat-option value="desktop">Desktop</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-checkbox>Include third-party requests</mat-checkbox>
        <mat-slide-toggle>Show expanded view</mat-slide-toggle>
      </div>
    `,
  }),
};
