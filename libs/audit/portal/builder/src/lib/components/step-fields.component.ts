import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import type { BuilderFieldSpec } from '@app-speed/audit/domain';
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
    MatError,
    MatFabButton,
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
      @if (optional.length > 0) {
        <div class="optional-fields">
          <h4>Optional Properties</h4>
          <div class="optional-fields__actions">
            @for (field of optional; track field.path) {
              <button
                mat-fab
                [extended]="true"
                color="primary"
                type="button"
                (click)="stepForm().addOptionalField(control(), field)"
              >
                {{ labelFor(field) }}
              </button>
            }
          </div>
        </div>
      }
    </div>

    <ng-template #fieldTemplate let-field="field" let-fieldControl="fieldControl">
      @switch (field.kind) {
        @case ('string') {
          <div class="field-row">
            <mat-form-field class="field-row__control">
              <mat-label>{{ labelFor(field) }}</mat-label>
              <input matInput [formControl]="asFormControl(fieldControl)" type="text" />
              @if (descriptionFor(field); as description) {
                <mat-hint>{{ description }}</mat-hint>
              }
              @if (asFormControl(fieldControl).hasError('required')) {
                <mat-error>{{ labelFor(field) }} is required</mat-error>
              }
              @if (asFormControl(fieldControl).hasError('pattern')) {
                <mat-error>{{ labelFor(field) }} does not match the expected format</mat-error>
              }
            </mat-form-field>
            @if (!field.required) {
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
        @case ('number') {
          <div class="field-row">
            <mat-form-field class="field-row__control">
              <mat-label>{{ labelFor(field) }}</mat-label>
              <input matInput [formControl]="asFormControl(fieldControl)" type="number" />
              @if (descriptionFor(field); as description) {
                <mat-hint>{{ description }}</mat-hint>
              }
              @if (asFormControl(fieldControl).hasError('required')) {
                <mat-error>{{ labelFor(field) }} is required</mat-error>
              }
              @if (asFormControl(fieldControl).hasError('min')) {
                <mat-error>{{ labelFor(field) }} must stay above the minimum value</mat-error>
              }
              @if (asFormControl(fieldControl).hasError('integer')) {
                <mat-error>{{ labelFor(field) }} must be an integer</mat-error>
              }
            </mat-form-field>
            @if (!field.required) {
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
        @case ('boolean') {
          <div class="field-row">
            <mat-form-field class="field-row__control">
              <mat-label>{{ labelFor(field) }}</mat-label>
              <mat-select [formControl]="asFormControl(fieldControl)">
                <mat-option [value]="true">True</mat-option>
                <mat-option [value]="false">False</mat-option>
              </mat-select>
              @if (descriptionFor(field); as description) {
                <mat-hint>{{ description }}</mat-hint>
              }
            </mat-form-field>
            @if (!field.required) {
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
        @case ('enum') {
          <div class="field-row">
            <mat-form-field class="field-row__control">
              <mat-label>{{ labelFor(field) }}</mat-label>
              <mat-select [formControl]="asFormControl(fieldControl)">
                @for (option of field.options; track option) {
                  <mat-option [value]="option">{{ option }}</mat-option>
                }
              </mat-select>
              @if (descriptionFor(field); as description) {
                <mat-hint>{{ description }}</mat-hint>
              }
              @if (asFormControl(fieldControl).hasError('required')) {
                <mat-error>{{ labelFor(field) }} is required</mat-error>
              }
            </mat-form-field>
            @if (!field.required) {
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
        @case ('literal') {
          <div class="field-row">
            <mat-form-field class="field-row__control">
              <mat-label>{{ labelFor(field) }}</mat-label>
              <input matInput [formControl]="asFormControl(fieldControl)" readonly type="text" />
              @if (descriptionFor(field); as description) {
                <mat-hint>{{ description }}</mat-hint>
              }
            </mat-form-field>
          </div>
        }
        @case ('group') {
          <section class="group-field">
            <div class="group-field__header">
              <div>
                <h4>{{ labelFor(field) }}</h4>
                @if (descriptionFor(field); as description) {
                  <p>{{ description }}</p>
                }
              </div>
              @if (!field.required) {
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
          <section class="group-field">
            <div class="group-field__header">
              <div>
                <h4>{{ labelFor(field) }}</h4>
                @if (descriptionFor(field); as description) {
                  <p>{{ description }}</p>
                }
              </div>
              <div class="group-field__actions">
                <button
                  mat-icon-button
                  aria-label="Add property to step"
                  type="button"
                  (click)="stepForm().addArrayItem(asFormArray(fieldControl), field)"
                >
                  <mat-icon>library_add</mat-icon>
                </button>
                @if (!field.required) {
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
                    <button
                      mat-icon-button
                      aria-label="Delete property from step"
                      type="button"
                      (click)="stepForm().removeArrayItem(asFormArray(fieldControl), $index)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
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
                  <mat-form-field class="field-row__control">
                    <mat-label>{{ labelFor(field.element) }}</mat-label>
                    <input
                      matInput
                      [formControl]="asFormControl(itemControl)"
                      [type]="field.element.kind === 'number' ? 'number' : 'text'"
                    />
                  </mat-form-field>
                  <button
                    mat-icon-button
                    aria-label="Delete property from step"
                    type="button"
                    (click)="stepForm().removeArrayItem(asFormArray(fieldControl), $index)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              }
            }
          </section>
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
              @if (!field.required) {
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
                <mat-form-field class="field-row__control">
                  <mat-label>{{ labelFor(field.value) }}</mat-label>
                  <input
                    matInput
                    [formControl]="asFormControl(entry.control)"
                    [type]="field.value.kind === 'number' ? 'number' : 'text'"
                  />
                </mat-form-field>
                <button
                  mat-icon-button
                  aria-label="Delete property from step"
                  type="button"
                  (click)="stepForm().removeRecordEntry(asFormRecord(fieldControl), entry.key)"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }

            <div class="field-row field-row--record-add">
              <mat-form-field class="field-row__control">
                <mat-label>New Key</mat-label>
                <input #recordKey matInput type="text" />
              </mat-form-field>
              <button mat-button type="button" (click)="addRecordEntry(field, asFormRecord(fieldControl), recordKey)">
                Add Entry
              </button>
            </div>
          </section>
        }
      }
    </ng-template>
  `,
  styles: `
    .step-fields {
      display: grid;
      gap: 16px;
    }

    .field-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .field-row__control {
      flex: 1 1 auto;
    }

    .field-row--record {
      align-items: center;
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
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 16px;
      background: rgba(0, 0, 0, 0.02);
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
    .array-item__header h5,
    .optional-fields h4 {
      margin: 0;
    }

    .group-field__header p {
      margin: 4px 0 0;
      color: rgba(0, 0, 0, 0.65);
    }

    .group-field__error {
      margin: 0;
      color: #b3261e;
    }

    .array-item {
      display: grid;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .array-item__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .optional-fields {
      display: grid;
      gap: 12px;
    }

    .optional-fields__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
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
      humanizeStepToken(stepFieldControlName(field) || field.path)
    );
  }

  protected descriptionFor(field: BuilderFieldSpec): string | undefined {
    return getStepFieldPresentation(this.variantId(), field.path)?.description;
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
