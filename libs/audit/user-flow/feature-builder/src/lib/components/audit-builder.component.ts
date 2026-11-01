import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  input,
  OnInit,
  output,
  viewChild,
  inject,
  effect,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { AuditFormGroup } from './audit-builder-form';
import { MatAccordion } from '@angular/material/expansion';
import { AuditStepComponent } from './audit-step.component';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { RxIf } from '@rx-angular/template/if';
import { DEVICE_OPTIONS } from '@app-speed/audit/core/domain';
import { AuditDetails } from '../audit-details';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToTitleCasePipe } from '@app-speed/audit/core/portal-ui';

@Component({
  selector: 'ui-audit-builder',
  template: `
    <form class="grid-container" [formGroup]="formGroup" (ngSubmit)="submitCurrentAudit()">
      <mat-card class="audit-card" [class.audit-card--readonly]="!modifying()" data-testid="audit-builder-card">
        <mat-card-content>
          <div class="row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Audit Title</mat-label>
              <input
                matInput
                placeholder="e.g. Checkout journey"
                [formControl]="formGroup.controls.title"
                name="audit title"
              />
              <mat-error *rxIf="formGroup.controls.title.hasError('required')"
                >Title <strong>required</strong></mat-error
              >
            </mat-form-field>
          </div>
          <div class="row">
            <mat-form-field appearance="outline" class="full-width col">
              <mat-label>Device Type</mat-label>
              <mat-select [formControl]="formGroup.controls.device">
                @for (device of DEVICE_TYPES; track device) {
                  <mat-option [value]="device">{{ device | toTitleCase }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width col">
              <mat-label>Timeout (ms)</mat-label>
              <input
                matInput
                type="number"
                min="1"
                max="99999"
                placeholder="e.g. 30000"
                [formControl]="formGroup.controls.timeout"
              />
              <mat-error *rxIf="formGroup.controls.timeout.invalid">Enter a timeout between 1 and 99999 ms.</mat-error>
            </mat-form-field>
          </div>
          <mat-accordion class="flow-steps" [multi]="true">
            @for (step of formGroup.controls.steps.controls; track step) {
              <ui-audit-builder-step [stepControl]="step" [expanded]="stepExpanded()" [stepNumber]="$index + 1">
                @if (formGroup.enabled) {
                  <div class="toggle-menu">
                    <button
                      type="button"
                      mat-icon-button
                      class="toggle_menu"
                      aria-label="Toggle menu"
                      [matMenuTriggerFor]="menu"
                    >
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #menu="matMenu" xPosition="before">
                      <button type="button" mat-menu-item (click)="formGroup.removeStepAt($index)">Remove Step</button>
                      <button type="button" mat-menu-item (click)="formGroup.addStepAt($index)">Add Step Before</button>
                      <button type="button" mat-menu-item (click)="formGroup.addStepAt($index + 1)">
                        Add Step After
                      </button>
                    </mat-menu>
                  </div>
                }
              </ui-audit-builder-step>
            }
          </mat-accordion>
        </mat-card-content>
      </mat-card>
      @if (primaryAction() !== 'none') {
        <div class="action-bar" role="region" aria-label="Audit actions">
          <div class="action-bar__summary">
            <strong
              >{{ formGroup.controls.steps.length }}
              {{ formGroup.controls.steps.length === 1 ? 'step' : 'steps' }}</strong
            >
            <p aria-live="polite">
              {{ primaryAction() === 'fork' ? 'Fork this audit to edit its steps.' : readinessMessage() }}
            </p>
          </div>
          @if (primaryAction() === 'analyze') {
            <button class="submit-btn" mat-flat-button [disabled]="!canSubmitAudit()" type="submit">
              {{ submittingRequest() ? 'Starting audit…' : 'Run audit' }}
            </button>
          } @else {
            <button class="submit-btn" mat-flat-button type="button" (click)="forked.emit()">Fork</button>
          }
        </div>
      }
    </form>
  `,
  styleUrl: './audit-builder.styles.scss',
  imports: [
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    MatButton,
    MatAccordion,
    AuditStepComponent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    RxIf,
    ToTitleCasePipe,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditBuilderComponent implements OnInit {
  public submitAudit = output<AuditDetails>();
  public readonly modified = output<AuditDetails>();
  public readonly forked = output<void>();
  initialAudit = input.required<AuditDetails>();
  protected readonly DEVICE_TYPES: readonly string[] = DEVICE_OPTIONS;
  private readonly destroyRef = inject(DestroyRef);
  public readonly modifying = input.required<boolean>();
  public readonly primaryAction = input<'analyze' | 'fork' | 'none'>('analyze');
  public readonly submittingRequest = input(false);
  public readonly collapseSteps = input(false);
  protected readonly stepExpanded = computed(() => !this.collapseSteps());

  constructor() {
    effect(() => {
      this.syncFormMode(this.modifying());
    });
  }

  ngOnInit(): void {
    this.formGroup = new AuditFormGroup(this.initialAudit());
    this.syncFormMode(this.modifying());

    this.formGroup.valueChanges
      .pipe(
        tap(() => this.modified.emit(this.auditValue())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
  public formGroup!: AuditFormGroup;
  public accordion = viewChild.required(MatAccordion);

  protected auditValue(): AuditDetails {
    return this.formGroup.getRawValue() as unknown as AuditDetails;
  }

  protected submitCurrentAudit(): void {
    if (!this.canSubmitAudit()) {
      return;
    }

    this.submitAudit.emit(this.auditValue());
  }

  protected canSubmitAudit(): boolean {
    return (
      this.primaryAction() === 'analyze' &&
      this.modifying() &&
      !this.submittingRequest() &&
      this.formGroup?.enabled === true &&
      this.formGroup.valid &&
      this.formGroup.controls.steps.controls.every((step) => step.selectionControl.valid)
    );
  }

  protected readinessMessage(): string {
    if (this.submittingRequest()) return 'Submitting your audit request…';
    if (this.formGroup.controls.title.invalid) return 'Add an audit title to continue.';
    if (this.formGroup.controls.device.invalid) return 'Choose a device to continue.';
    if (this.formGroup.controls.timeout.invalid) return 'Enter a valid timeout in milliseconds.';
    const steps = this.formGroup.controls.steps.controls;
    if (steps.length === 0) return 'Add at least one step to run your audit.';
    const invalidIndex = steps.findIndex((step) => step.invalid || step.selectionControl.invalid);
    if (invalidIndex !== -1) {
      return `Complete the required fields in step ${invalidIndex + 1} and check its optional properties.`;
    }
    return 'Ready to run your audit.';
  }

  private syncFormMode(modifying: boolean): void {
    if (!this.formGroup) {
      return;
    }

    if (modifying) {
      this.formGroup.enable();
    } else {
      this.formGroup.disable();
    }
  }
}
