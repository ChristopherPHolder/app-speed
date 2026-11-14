import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import type { BuilderFieldSpec } from '@app-speed/audit/core/domain';
import { BuilderStepFormGroup, stepFieldControlName } from '../step-form';
import { getStepFieldPresentation, humanizeStepToken } from '../step-presentation';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs';

type RecordField = Extract<BuilderFieldSpec, { kind: 'record' }>;
type RecordDraft = { name: FormControl<string>; value: FormControl<string> | null };

@Component({
  selector: 'builder-step-fields',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatHint,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
  ],
  template: `
    <div class="step-fields">
      @for (field of visibleRequiredFields(); track field.path) {
        <ng-container
          [ngTemplateOutlet]="fieldTemplate"
          [ngTemplateOutletContext]="{ field, fieldControl: childControl(field) }"
        />
      }
      @for (field of visibleOptionalFields(); track field.path) {
        <ng-container
          [ngTemplateOutlet]="fieldTemplate"
          [ngTemplateOutletContext]="{ field, fieldControl: childControl(field) }"
        />
      }
      @let optional = optionalFields();
      @if (control().enabled && optional.length > 0) {
        <section class="optional-fields">
          <h4>Optional properties</h4>
          <div class="optional-fields__actions">
            @for (field of optional; track field.path) {
              <button mat-button type="button" (click)="stepForm().addOptionalField(control(), field)">
                <mat-icon>add</mat-icon>
                {{ labelFor(field) }}
              </button>
            }
          </div>
        </section>
      }
    </div>

    <ng-template #fieldTemplate let-field="field" let-fieldControl="fieldControl">
      @switch (field.kind) {
        @case ('group') {
          <section class="group-field">
            <div class="group-field__header">
              <div>
                <h4>{{ labelFor(field) }}</h4>
                @if (descriptionFor(field); as description) {
                  <p>{{ description }}</p>
                }
              </div>
              @if (control().enabled && !field.required) {
                <button
                  mat-icon-button
                  [attr.aria-label]="removeLabel(field)"
                  type="button"
                  (click)="stepForm().removeOptionalField(control(), field)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>
            <builder-step-fields
              [variantId]="variantId()"
              [fields]="field.fields"
              [control]="asFormGroup(fieldControl)"
              [stepForm]="stepForm()"
            />
          </section>
        }
        @case ('array') {
          @if (field.path === 'selectors') {
            <div class="selector-fields">
              @let paths = asFormArray(fieldControl);
              @for (path of paths.controls; track path; let pathIndex = $index) {
                @let segments = selectorSegments(path);
                <div
                  class="selector-path"
                  role="group"
                  [attr.aria-label]="
                    pathIndex === 0 ? 'Primary selector path' : 'Alternative selector path ' + pathIndex
                  "
                  [class.selector-path--alternative]="paths.length > 1"
                >
                  @if (paths.length > 1) {
                    <h4 class="selector-path__title">
                      {{ pathIndex === 0 ? 'Primary selector' : 'Alternative selector ' + pathIndex }}
                    </h4>
                  }
                  @if (segments.length > 1) {
                    <p class="selector-path__hint">Follow the path from the outermost parent to the target element.</p>
                  }
                  @for (segment of segments.controls; track segment; let segmentIndex = $index) {
                    <div
                      class="field-row selector-segment"
                      [class.selector-segment--child]="segmentIndex > 0"
                      [style.margin-left.px]="selectorIndent(segmentIndex)"
                    >
                      <mat-form-field appearance="outline" class="field-row__control">
                        <mat-label>{{ selectorLabel(pathIndex, segmentIndex, segments.length) }}</mat-label>
                        <input
                          matInput
                          [formControl]="asFormControl(segment)"
                          required
                          placeholder="e.g. #checkout-button"
                        />
                        @if (segmentIndex === 0 && segments.length === 1) {
                          <mat-hint>{{
                            pathIndex === 0
                              ? 'Identifies the element to interact with.'
                              : 'Another way to identify the same element.'
                          }}</mat-hint>
                        }
                        <mat-error>Enter a selector.</mat-error>
                      </mat-form-field>
                      @if (paths.enabled && segments.length > 1) {
                        <button
                          mat-icon-button
                          type="button"
                          aria-label="Remove selector segment"
                          (click)="stepForm().removeArrayItem(segments, segmentIndex)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                      @if (paths.enabled && paths.length > 1 && segmentIndex === 0) {
                        <button
                          mat-icon-button
                          type="button"
                          aria-label="Remove selector"
                          (click)="stepForm().removeArrayItem(paths, pathIndex)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                  }
                  @if (paths.enabled) {
                    <button
                      mat-button
                      class="selector-path__add"
                      type="button"
                      (click)="addSelectorSegment(segments, field)"
                    >
                      <mat-icon>add</mat-icon>Add path segment
                    </button>
                  }
                </div>
              }
              @if (paths.enabled) {
                <button
                  mat-button
                  class="selector-fields__add"
                  type="button"
                  (click)="stepForm().addArrayItem(paths, field)"
                >
                  <mat-icon>add</mat-icon>Add alternative selector
                </button>
              }
            </div>
          } @else {
            <section class="group-field">
              @let items = asFormArray(fieldControl);
              <div class="group-field__header">
                <div>
                  <h4>{{ labelFor(field) }}</h4>
                  @if (descriptionFor(field); as description) {
                    <p>{{ description }}</p>
                  }
                </div>
                @if (control().enabled && !field.required) {
                  <button
                    mat-icon-button
                    [attr.aria-label]="removeLabel(field)"
                    type="button"
                    (click)="stepForm().removeOptionalField(control(), field)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>

              @if (items.hasError('minlength')) {
                <p class="group-field__error">Add at least one {{ inline(itemLabelFor(field)) }}.</p>
              }

              @for (itemControl of items.controls; track itemControl) {
                @let itemLabel = itemLabelFor(field) + ' ' + ($index + 1);
                @if (field.element.kind === 'group') {
                  <section class="array-item">
                    <div class="array-item__header">
                      <h5>{{ itemLabel }}</h5>
                      @if (items.enabled) {
                        <button
                          mat-icon-button
                          [attr.aria-label]="'Remove ' + inline(itemLabel)"
                          type="button"
                          (click)="stepForm().removeArrayItem(items, $index)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      }
                    </div>
                    <builder-step-fields
                      [variantId]="variantId()"
                      [fields]="field.element.fields"
                      [control]="asFormGroup(itemControl)"
                      [stepForm]="stepForm()"
                    />
                  </section>
                } @else {
                  <div class="field-row">
                    <ng-container
                      [ngTemplateOutlet]="scalarControl"
                      [ngTemplateOutletContext]="{ field: field.element, fieldControl: itemControl, label: itemLabel }"
                    />
                    @if (items.enabled) {
                      <button
                        mat-icon-button
                        [attr.aria-label]="'Remove ' + inline(itemLabel)"
                        type="button"
                        (click)="stepForm().removeArrayItem(items, $index)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                }
              }

              @if (items.enabled) {
                <button
                  mat-button
                  class="group-field__add"
                  type="button"
                  (click)="stepForm().addArrayItem(items, field)"
                >
                  <mat-icon>add</mat-icon>Add {{ inline(itemLabelFor(field)) }}
                </button>
              }
            </section>
          }
        }
        @case ('record') {
          <section class="group-field">
            <div class="group-field__header">
              <div>
                <h4>{{ labelFor(field) }}</h4>
                @if (descriptionFor(field); as description) {
                  <p>{{ description }}</p>
                }
              </div>
              @if (control().enabled && !field.required) {
                <button
                  mat-icon-button
                  [attr.aria-label]="removeLabel(field)"
                  type="button"
                  (click)="stepForm().removeOptionalField(control(), field)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>

            @let entries = asFormRecord(fieldControl);
            @let entryLabel = itemLabelFor(field);
            @for (entry of recordEntries(entries); track entry.key) {
              <div class="field-row field-row--record">
                <!-- The entry's name is the label of its value, so a row is one field. -->
                <ng-container
                  [ngTemplateOutlet]="scalarControl"
                  [ngTemplateOutletContext]="{ field: field.value, fieldControl: entry.control, label: entry.key }"
                />
                @if (entries.enabled) {
                  <button
                    mat-icon-button
                    [attr.aria-label]="'Remove ' + inline(entryLabel) + ' ' + entry.key"
                    type="button"
                    (click)="stepForm().removeRecordEntry(entries, entry.key)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>
            }

            @if (entries.enabled) {
              @let draft = recordDraft(field);
              <!-- Enter adds the entry. Without the handler it would submit the audit form around it. -->
              <div
                class="record-add"
                role="group"
                [attr.aria-label]="'Add ' + inline(entryLabel)"
                (keydown.enter)="addRecordEntry(field, entries, draftName, $event)"
              >
                <mat-form-field appearance="outline" class="record-add__field">
                  <mat-label>{{ entryLabel }} name</mat-label>
                  <input #draftName matInput [formControl]="draft.name" type="text" autocomplete="off" />
                  @if (draft.name.hasError('duplicate')) {
                    <mat-error>{{ entryLabel }} “{{ draft.name.value.trim() }}” is already listed.</mat-error>
                  } @else if (draft.name.hasError('required')) {
                    <mat-error>Enter a name.</mat-error>
                  }
                </mat-form-field>
                @if (draft.value; as draftValue) {
                  <mat-form-field appearance="outline" class="record-add__field">
                    <mat-label>Value</mat-label>
                    <input matInput [formControl]="draftValue" type="text" autocomplete="off" />
                  </mat-form-field>
                }
                <button
                  matButton="tonal"
                  class="record-add__button"
                  type="button"
                  (click)="addRecordEntry(field, entries, draftName)"
                >
                  <mat-icon>add</mat-icon>Add {{ inline(entryLabel) }}
                </button>
              </div>
            }
          </section>
        }
        @default {
          <div class="field-row" [class.field-row--compact]="field.kind === 'boolean'">
            <ng-container
              [ngTemplateOutlet]="scalarControl"
              [ngTemplateOutletContext]="{ field, fieldControl, label: labelFor(field) }"
            />
            @if (control().enabled && !field.required) {
              <button
                mat-icon-button
                [attr.aria-label]="removeLabel(field)"
                type="button"
                (click)="stepForm().removeOptionalField(control(), field)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            }
          </div>
        }
      }
    </ng-template>

    <!-- One control per scalar type, shared by step properties, list items and key/value entries. -->
    <ng-template #scalarControl let-field="field" let-fieldControl="fieldControl" let-label="label">
      @let scalar = asFormControl(fieldControl);
      @switch (field.kind) {
        @case ('boolean') {
          <div class="field-row__control checkbox-field">
            <mat-checkbox [formControl]="scalar">{{ label }}</mat-checkbox>
            @if (descriptionFor(field); as description) {
              <p class="checkbox-field__hint">{{ description }}</p>
            }
          </div>
        }
        @case ('number') {
          <mat-form-field appearance="outline" class="field-row__control">
            <mat-label>{{ label }}</mat-label>
            <input matInput [formControl]="scalar" type="number" />
            @if (descriptionFor(field); as description) {
              <mat-hint>{{ description }}</mat-hint>
            }
            @if (errorFor(field, scalar); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        }
        @case ('enum') {
          <mat-form-field appearance="outline" class="field-row__control">
            <mat-label>{{ label }}</mat-label>
            <mat-select [formControl]="scalar">
              @for (option of field.options; track option) {
                <mat-option [value]="option">{{ optionLabel(field, option) }}</mat-option>
              }
            </mat-select>
            @if (descriptionFor(field); as description) {
              <mat-hint>{{ description }}</mat-hint>
            }
            @if (errorFor(field, scalar); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        }
        @case ('literal') {
          <mat-form-field appearance="outline" class="field-row__control">
            <mat-label>{{ label }}</mat-label>
            <input matInput [formControl]="scalar" readonly type="text" />
            @if (descriptionFor(field); as description) {
              <mat-hint>{{ description }}</mat-hint>
            }
          </mat-form-field>
        }
        @default {
          <mat-form-field appearance="outline" class="field-row__control">
            <mat-label>{{ label }}</mat-label>
            <input matInput [formControl]="scalar" [placeholder]="placeholderFor(field)" type="text" />
            @if (descriptionFor(field); as description) {
              <mat-hint>{{ description }}</mat-hint>
            }
            @if (errorFor(field, scalar); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        }
      }
    </ng-template>
  `,
  styles: `
    /*
     * Every grid here has one column that may shrink below its content. An implicit column is as wide
     * as its widest row, which pushed the whole step past the edge of the form in compact windows.
     */
    .step-fields,
    .selector-fields,
    .selector-path,
    .group-field,
    .array-item,
    .optional-fields,
    .checkbox-field {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
    }

    .step-fields {
      gap: var(--ui-space-4);
    }

    .selector-fields,
    .selector-path {
      gap: var(--ui-space-2);
    }

    .selector-path__title {
      margin: 0 0 var(--ui-space-1);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
    }

    .selector-path__hint {
      margin: 0 0 var(--ui-space-2);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .selector-path--alternative {
      padding-left: var(--ui-space-4);
      border-left: 2px solid var(--mat-sys-outline-variant);
    }

    .selector-segment {
      position: relative;
    }

    .selector-segment--child::before {
      content: '';
      position: absolute;
      left: calc(-1 * var(--ui-space-3));
      top: calc(-1 * var(--ui-space-5));
      width: var(--ui-space-2);
      height: var(--ui-space-12);
      border-left: 1px solid var(--mat-sys-outline-variant);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      border-bottom-left-radius: var(--mat-sys-corner-extra-small);
    }

    .selector-path + .selector-path {
      margin-top: var(--ui-space-2);
    }

    .selector-path__add,
    .selector-fields__add,
    .group-field__add {
      justify-self: start;
    }

    .field-row {
      display: flex;
      align-items: flex-start;
      gap: var(--ui-space-2);
    }

    .field-row__control {
      min-width: 0;
      flex: 1 1 auto;
    }

    /* Centre a 40dp icon button on the 56dp field beside it; a checkbox row is already 40dp tall. */
    .field-row > button {
      flex: none;
      margin-top: var(--ui-space-2);
    }

    .field-row--compact > button {
      margin-top: 0;
    }

    .record-add {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--ui-space-2);
    }

    .record-add__field {
      min-width: 0;
      flex: 1 1 160px;
    }

    .record-add__button {
      flex: none;
      /* Centre the 40dp button on the 56dp fields beside it. */
      margin-top: var(--ui-space-2);
    }

    .checkbox-field__hint {
      /* Line the description up with the label, past the checkbox's 40dp target. */
      margin: 0 0 0 var(--ui-space-10);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .group-field {
      gap: var(--ui-space-3);
      padding: var(--ui-space-3) var(--ui-space-4);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-low);
    }

    .group-field__header,
    .array-item__header {
      display: flex;
      justify-content: space-between;
      gap: var(--ui-space-2);
    }

    .group-field__header {
      align-items: flex-start;
    }

    .array-item__header {
      align-items: center;
    }

    .group-field__header > div {
      min-width: 0;
      /* Line the heading up with the 40dp remove button beside it. */
      padding-top: var(--ui-space-2);
    }

    .group-field__header h4 {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .array-item__header h5 {
      margin: 0;
      font: var(--mat-sys-title-small);
    }

    .group-field__header p {
      margin: var(--ui-space-1) 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .group-field__error {
      margin: 0;
      color: var(--mat-sys-error);
      font: var(--mat-sys-body-small);
    }

    .array-item {
      gap: var(--ui-space-3);
      padding: var(--ui-space-3);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface);
    }

    .optional-fields {
      gap: var(--ui-space-2);
    }

    .optional-fields h4 {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
    }

    .optional-fields__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ui-space-1) var(--ui-space-2);
    }

    @media (width < 600px) {
      .group-field {
        padding: var(--ui-space-3);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFieldsComponent {
  readonly variantId = input.required<string>();
  readonly fields = input.required<readonly BuilderFieldSpec[]>();
  readonly control = input.required<FormGroup>();
  readonly stepForm = input.required<BuilderStepFormGroup>();

  private readonly recordDrafts = new Map<string, RecordDraft>();

  private fieldControl = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.valueChanges.pipe(
          startWith(null),
          map(() => Object.keys(control.controls)),
          distinctUntilChanged(
            (a: readonly string[], b: readonly string[]) =>
              a.length === b.length && a.every((value, index) => value === b[index]),
          ),
        ),
      ),
    ),
    { initialValue: [] as string[] },
  );

  // A literal has one possible value, so there is nothing to show or edit; its control still carries it.
  protected readonly visibleRequiredFields = computed(() =>
    this.fields().filter((field) => field.required && field.kind !== 'literal'),
  );
  protected readonly visibleOptionalFields = computed(() =>
    this.fields().filter((field) => !field.required && this.fieldControl().includes(stepFieldControlName(field))),
  );
  protected readonly optionalFields = computed(() =>
    this.fields().filter((field) => !field.required && !this.fieldControl().includes(stepFieldControlName(field))),
  );

  protected childControl(field: BuilderFieldSpec): AbstractControl {
    const control = this.control().get(stepFieldControlName(field));

    if (!control) {
      throw new Error(`Missing control for field "${field.path}"`);
    }

    return control;
  }

  protected labelFor(field: BuilderFieldSpec): string {
    return (
      getStepFieldPresentation(this.variantId(), field.path)?.label ??
      humanizeStepToken(stepFieldControlName(field) || field.path)
    );
  }

  /** Names one item of a list or one entry of a map, falling back to the field's own label. */
  protected itemLabelFor(field: BuilderFieldSpec): string {
    return getStepFieldPresentation(this.variantId(), field.path)?.itemLabel ?? this.labelFor(field);
  }

  protected optionLabel(field: BuilderFieldSpec, option: unknown): string {
    return getStepFieldPresentation(this.variantId(), field.path)?.options?.[String(option)] ?? String(option);
  }

  protected removeLabel(field: BuilderFieldSpec): string {
    return `Remove ${this.inline(this.labelFor(field))}`;
  }

  /** Lower-cases a label for use inside a sentence, leaving acronyms and names such as "URL" or "SameSite". */
  protected inline(label: string): string {
    return /^[A-Z][a-z]+(\s|$)/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  }

  protected placeholderFor(field: BuilderFieldSpec): string {
    const key = stepFieldControlName(field);
    if (key === 'url') return 'https://example.com/checkout';
    if (key === 'name') return 'e.g. Checkout page';
    return '';
  }

  protected descriptionFor(field: BuilderFieldSpec): string | undefined {
    return getStepFieldPresentation(this.variantId(), field.path)?.description;
  }

  /** What is wrong with the value and how to fix it, or null while the control is valid. */
  protected errorFor(field: BuilderFieldSpec, control: FormControl): string | null {
    if (control.hasError('required')) return field.kind === 'enum' ? 'Choose an option.' : 'Enter a value.';
    if (control.hasError('oneOf')) return 'Choose one of the listed options.';
    if (control.hasError('pattern')) {
      return stepFieldControlName(field) === 'url'
        ? 'Enter an https:// URL or about:blank.'
        : 'Use the expected format.';
    }
    if (control.hasError('minlength')) {
      return `Enter at least ${control.getError('minlength').requiredLength} characters.`;
    }
    if (control.hasError('integer')) return 'Enter a whole number.';
    if (control.hasError('min')) return `Enter ${control.getError('min').min} or more.`;
    if (control.hasError('max')) return `Enter ${control.getError('max').max} or less.`;
    return null;
  }

  protected selectorSegments(path: AbstractControl): FormArray<AbstractControl> {
    const segments = path.get('segments');
    if (!(segments instanceof FormArray)) throw new Error('Missing selector segments');
    return segments;
  }

  protected selectorLabel(pathIndex: number, segmentIndex: number, segmentCount: number): string {
    const label = pathIndex === 0 ? 'Selector' : `Alternative selector ${pathIndex}`;
    if (segmentCount === 1) return label;
    if (segmentIndex === segmentCount - 1) return 'Target selector';
    return segmentIndex === 0 ? 'Parent selector' : `Nested selector ${segmentIndex}`;
  }

  protected selectorIndent(segmentIndex: number): number {
    return Math.min(segmentIndex, 3) * 16;
  }

  protected addSelectorSegment(segments: FormArray<AbstractControl>, field: BuilderFieldSpec): void {
    if (field.kind !== 'array' || field.element.kind !== 'group') return;
    const segmentField = field.element.fields.find((child) => child.path === 'selectors[].segments');
    if (segmentField?.kind === 'array') this.stepForm().addArrayItem(segments, segmentField);
  }

  protected asFormArray(control: AbstractControl): FormArray<AbstractControl> {
    return control as FormArray<AbstractControl>;
  }

  protected asFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  protected asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  protected asFormRecord(control: AbstractControl): FormRecord<AbstractControl> {
    return control as FormRecord<AbstractControl>;
  }

  protected recordEntries(control: FormRecord<AbstractControl>): Array<{ key: string; control: AbstractControl }> {
    return Object.entries(control.controls).map(([key, entryControl]) => ({ key, control: entryControl }));
  }

  /** The name and value being typed for the next entry of a map. They are not part of the step's value. */
  protected recordDraft(field: RecordField): RecordDraft {
    let draft = this.recordDrafts.get(field.path);
    if (!draft) {
      draft = {
        name: new FormControl('', { nonNullable: true }),
        // Only a text value can be typed alongside the name; other types are added blank and edited in place.
        value: field.value.kind === 'string' ? new FormControl('', { nonNullable: true }) : null,
      };
      this.recordDrafts.set(field.path, draft);
    }
    return draft;
  }

  protected addRecordEntry(
    field: RecordField,
    control: FormRecord<AbstractControl>,
    nameInput: HTMLInputElement,
    event?: Event,
  ): void {
    // Enter inside a form submits it; here it adds the entry instead.
    event?.preventDefault();

    const draft = this.recordDraft(field);
    const name = draft.name.value.trim();

    if (name.length === 0 || name in control.controls) {
      draft.name.setErrors(name.length === 0 ? { required: true } : { duplicate: true });
      draft.name.markAsTouched();
      nameInput.focus();
      return;
    }

    if (this.stepForm().addRecordEntry(control, field, name, draft.value?.value)) {
      draft.name.reset();
      draft.value?.reset();
      nameInput.focus();
    }
  }
}
