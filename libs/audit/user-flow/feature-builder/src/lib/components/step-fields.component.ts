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
          <h4>Optional Properties</h4>
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
                  aria-label="Delete property from step"
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
              <div class="group-field__header">
                <div>
                  <h4>{{ labelFor(field) }}</h4>
                  @if (descriptionFor(field); as description) {
                    <p>{{ description }}</p>
                  }
                </div>
                <div class="group-field__actions">
                  @if (asFormArray(fieldControl).enabled) {
                    <button
                      mat-icon-button
                      aria-label="Add property to step"
                      type="button"
                      (click)="stepForm().addArrayItem(asFormArray(fieldControl), field)"
                    >
                      <mat-icon>library_add</mat-icon>
                    </button>
                  }
                  @if (control().enabled && !field.required) {
                    <button
                      mat-icon-button
                      aria-label="Delete property from step"
                      type="button"
                      (click)="stepForm().removeOptionalField(control(), field)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              </div>

              @if (asFormArray(fieldControl).hasError('minlength')) {
                <p class="group-field__error">{{ labelFor(field) }} needs at least one item</p>
              }

              @if (field.element.kind === 'group') {
                @for (itemControl of asFormArray(fieldControl).controls; track itemControl) {
                  <section class="array-item">
                    <div class="array-item__header">
                      <h5>{{ labelFor(field) }} {{ $index + 1 }}</h5>
                      @if (asFormArray(fieldControl).enabled) {
                        <button
                          mat-icon-button
                          aria-label="Delete property from step"
                          type="button"
                          (click)="stepForm().removeArrayItem(asFormArray(fieldControl), $index)"
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
                }
              } @else {
                @for (itemControl of asFormArray(fieldControl).controls; track itemControl) {
                  <div class="field-row">
                    <ng-container
                      [ngTemplateOutlet]="scalarControl"
                      [ngTemplateOutletContext]="{
                        field: field.element,
                        fieldControl: itemControl,
                        label: labelFor(field.element),
                      }"
                    />
                    @if (asFormArray(fieldControl).enabled) {
                      <button
                        mat-icon-button
                        aria-label="Delete property from step"
                        type="button"
                        (click)="stepForm().removeArrayItem(asFormArray(fieldControl), $index)"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    }
                  </div>
                }
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
                  aria-label="Delete property from step"
                  type="button"
                  (click)="stepForm().removeOptionalField(control(), field)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>

            @for (entry of recordEntries(asFormRecord(fieldControl)); track entry.key) {
              <div class="field-row field-row--record">
                <span class="record-key">{{ entry.key }}</span>
                <ng-container
                  [ngTemplateOutlet]="scalarControl"
                  [ngTemplateOutletContext]="{
                    field: field.value,
                    fieldControl: entry.control,
                    label: labelFor(field.value),
                  }"
                />
                @if (asFormRecord(fieldControl).enabled) {
                  <button
                    mat-icon-button
                    aria-label="Delete property from step"
                    type="button"
                    (click)="stepForm().removeRecordEntry(asFormRecord(fieldControl), entry.key)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>
            }

            @if (asFormRecord(fieldControl).enabled) {
              <div class="field-row field-row--record-add">
                <mat-form-field appearance="outline" class="field-row__control">
                  <mat-label>New Key</mat-label>
                  <input #recordKey matInput type="text" />
                </mat-form-field>
                <button mat-button type="button" (click)="addRecordEntry(field, asFormRecord(fieldControl), recordKey)">
                  Add Entry
                </button>
              </div>
            }
          </section>
        }
        @default {
          <div class="field-row">
            <ng-container
              [ngTemplateOutlet]="scalarControl"
              [ngTemplateOutletContext]="{ field, fieldControl, label: labelFor(field) }"
            />
            @if (control().enabled && !field.required) {
              <button
                mat-icon-button
                aria-label="Delete property from step"
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
            @if (errorFor(scalar, label); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        }
        @case ('enum') {
          <mat-form-field appearance="outline" class="field-row__control">
            <mat-label>{{ label }}</mat-label>
            <mat-select [formControl]="scalar">
              @for (option of field.options; track option) {
                <mat-option [value]="option">{{ option }}</mat-option>
              }
            </mat-select>
            @if (descriptionFor(field); as description) {
              <mat-hint>{{ description }}</mat-hint>
            }
            @if (errorFor(scalar, label); as error) {
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
            @if (errorFor(scalar, label); as error) {
              <mat-error>{{ error }}</mat-error>
            }
          </mat-form-field>
        }
      }
    </ng-template>
  `,
  styles: `
    .step-fields {
      display: grid;
      gap: 16px;
    }

    .selector-fields,
    .selector-path {
      display: grid;
      gap: 8px;
    }

    .selector-path__title {
      margin: 0 0 4px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
    }

    .selector-path__hint {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .selector-path--alternative {
      padding-left: 16px;
      border-left: 2px solid var(--mat-sys-outline-variant);
    }

    .selector-segment {
      position: relative;
    }

    .selector-segment--child::before {
      content: '';
      position: absolute;
      left: -12px;
      top: -20px;
      width: 8px;
      height: 48px;
      border-left: 1px solid var(--mat-sys-outline-variant);
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      border-bottom-left-radius: 4px;
    }

    .selector-path + .selector-path {
      margin-top: 8px;
    }

    .selector-path__add,
    .selector-fields__add {
      justify-self: start;
    }

    .field-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .field-row__control {
      min-width: 0;
      flex: 1 1 auto;
    }

    .field-row--record {
      align-items: center;
    }

    .checkbox-field {
      display: grid;
    }

    .checkbox-field__hint {
      /* Line the description up with the label, past the checkbox's 40dp target. */
      margin: 0 0 0 var(--ui-space-10);
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .field-row--record-add {
      align-items: flex-end;
    }

    .record-key {
      min-width: 120px;
      font-family: monospace;
    }

    .group-field {
      display: grid;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-surface-container-low);
    }

    .group-field__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .group-field__actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .group-field__header h4,
    .array-item__header h5 {
      margin: 0;
    }

    .group-field__header p {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .group-field__error {
      margin: 0;
      color: var(--mat-sys-error);
    }

    .array-item {
      display: grid;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface);
    }

    .array-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .optional-fields {
      display: grid;
      gap: 8px;
    }

    .optional-fields h4 {
      margin: 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-title-small);
    }

    .optional-fields__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepFieldsComponent {
  readonly variantId = input.required<string>();
  readonly fields = input.required<readonly BuilderFieldSpec[]>();
  readonly control = input.required<FormGroup>();
  readonly stepForm = input.required<BuilderStepFormGroup>();

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

  protected readonly visibleRequiredFields = computed(() => this.fields().filter((field) => field.required));
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
      (stepFieldControlName(field) === 'timeout'
        ? 'Timeout (ms)'
        : humanizeStepToken(stepFieldControlName(field) || field.path))
    );
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

  /** The message for the first failed check, or null while the control is valid. */
  protected errorFor(control: FormControl, label: string): string | null {
    if (control.hasError('required')) return `${label} is required`;
    if (control.hasError('pattern')) return `${label} does not match the expected format`;
    if (control.hasError('min')) return `${label} must stay above the minimum value`;
    if (control.hasError('max')) return `${label} must stay below the maximum value`;
    if (control.hasError('integer')) return `${label} must be an integer`;
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

  protected addRecordEntry(field: RecordField, control: FormRecord<AbstractControl>, keyInput: HTMLInputElement): void {
    const didAdd = this.stepForm().addRecordEntry(control, field, keyInput.value);

    if (didAdd) {
      keyInput.value = '';
    }
  }
}
