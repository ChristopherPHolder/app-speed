import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  input,
  OnInit,
  output,
  signal,
  viewChild,
  viewChildren,
  inject,
  effect,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { AuditFormGroup } from './audit-builder-form';
import { MatAccordion } from '@angular/material/expansion';
import { AuditStepComponent } from './audit-step.component';
import { provideBuilderFormFieldDefaults } from './form-field-defaults';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { DEVICE_OPTIONS } from '@app-speed/audit/core/domain';
import { AuditDetails } from '../audit-details';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToTitleCasePipe } from '@app-speed/audit/core/portal-ui';
import { EmptyStateActionsDirective, EmptyStateComponent } from '@app-speed/ui/empty-state';
import { MessageComponent } from '@app-speed/ui/message';
import { LIGHTHOUSE_AUDIT_STEP_TYPE } from '@app-speed/audit/user-flow/domain';

const AUDIT_STEP_TYPES: ReadonlySet<string> = new Set(Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE));

@Component({
  selector: 'ui-audit-builder',
  template: `
    <form class="builder" [formGroup]="formGroup" (ngSubmit)="submitCurrentAudit()">
      <mat-card
        appearance="outlined"
        class="audit-card"
        [class.audit-card--readonly]="!modifying()"
        data-testid="audit-builder-card"
      >
        <mat-card-content>
          <div class="fields">
            <mat-form-field appearance="outline" class="fields__title">
              <mat-label>Audit title</mat-label>
              <input
                matInput
                placeholder="Checkout journey"
                [formControl]="formGroup.controls.title"
                name="audit title"
              />
              @if (formGroup.controls.title.hasError('required')) {
                <mat-error>Enter a title.</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Device type</mat-label>
              <mat-select [formControl]="formGroup.controls.device">
                @for (device of DEVICE_TYPES; track device) {
                  <mat-option [value]="device">{{ device | toTitleCase }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Timeout (ms)</mat-label>
              <input
                matInput
                type="number"
                min="1"
                max="99999"
                placeholder="30000"
                [formControl]="formGroup.controls.timeout"
              />
              @if (formGroup.controls.timeout.invalid) {
                <mat-error>Enter 1 to 99999.</mat-error>
              }
            </mat-form-field>
          </div>
          <mat-accordion class="flow-steps" [multi]="true">
            @for (step of formGroup.controls.steps.controls; track step) {
              <ui-audit-builder-step
                [stepControl]="step"
                [expanded]="stepExpanded()"
                [stepNumber]="$index + 1"
                [showErrors]="attempted()"
              >
                @if (formGroup.enabled) {
                  <button
                    type="button"
                    matIconButton
                    [attr.aria-label]="'Actions for step ' + ($index + 1)"
                    [matMenuTriggerFor]="menu"
                  >
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu" xPosition="before">
                    <button type="button" mat-menu-item (click)="formGroup.addStepAt($index)">Add step before</button>
                    <button type="button" mat-menu-item (click)="formGroup.addStepAt($index + 1)">
                      Add step after
                    </button>
                    <mat-divider />
                    <button type="button" mat-menu-item (click)="formGroup.removeStepAt($index)">Remove step</button>
                  </mat-menu>
                }
              </ui-audit-builder-step>
            }
          </mat-accordion>
          @if (formGroup.enabled) {
            @if (formGroup.controls.steps.length === 0) {
              <ui-empty-state icon="playlist_add" heading="No steps yet">
                <button uiEmptyStateActions class="steps__add" matButton="tonal" type="button" (click)="addStep()">
                  <mat-icon aria-hidden="true">add</mat-icon>Add step
                </button>
              </ui-empty-state>
            } @else {
              <button class="steps__add steps__add--after" matButton="tonal" type="button" (click)="addStep()">
                <mat-icon aria-hidden="true">add</mat-icon>Add step
              </button>
            }
          }
        </mat-card-content>
      </mat-card>
      @if (primaryAction() !== 'none') {
        <div class="action-bar" role="region" aria-label="Audit actions">
          @if (errorMessage(); as message) {
            <ui-message class="action-bar__error" data-testid="audit-inline-error" tone="error">{{
              message
            }}</ui-message>
          }
          <div class="action-bar__row">
            <div class="action-bar__summary">
              <strong
                >{{ formGroup.controls.steps.length }}
                {{ formGroup.controls.steps.length === 1 ? 'step' : 'steps' }}</strong
              >
              <!-- Says what blocks the run, once a run was tried. The fields and steps involved are marked. -->
              <p class="action-bar__problem" aria-live="polite">
                @if (attempted() && problem(); as problem) {
                  <mat-icon aria-hidden="true">error</mat-icon>
                  <span>{{ problem }}</span>
                }
              </p>
            </div>
            @if (primaryAction() === 'analyze') {
              <!-- The button stays enabled: selecting it with something missing shows what and where. -->
              <button class="submit-btn" matButton="filled" [disabled]="submittingRequest()" type="submit">
                <mat-icon aria-hidden="true">play_arrow</mat-icon>
                {{ submittingRequest() ? 'Starting audit…' : 'Run audit' }}
              </button>
            } @else {
              <button class="submit-btn" matButton="filled" type="button" (click)="forked.emit()">
                <mat-icon aria-hidden="true">call_split</mat-icon>Fork
              </button>
            }
          </div>
        </div>
      }
    </form>
  `,
  styles: `
    :host {
      display: block;
      box-sizing: border-box;
      max-width: calc(var(--ui-page-width-medium) + 2 * var(--ui-page-gutter));
      margin: 0 auto;
      padding: 0 var(--ui-page-gutter) var(--ui-space-6);
    }
    mat-card-content {
      padding: var(--ui-space-4);
    }
    .audit-card--readonly {
      background: var(--mat-sys-surface-container-low);
    }
    .fields {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ui-space-4);
      margin-bottom: var(--ui-space-4);
    }
    .flow-steps {
      display: grid;
      /* The column may shrink below its content, so a wide row can't push a step past the card. */
      grid-template-columns: minmax(0, 1fr);
      gap: var(--ui-space-3);
    }
    .steps__add--after {
      margin-top: var(--ui-space-4);
    }
    .action-bar {
      position: sticky;
      /* Clear the home indicator on phones that have one. */
      bottom: calc(var(--ui-space-3) + env(safe-area-inset-bottom, 0px));
      z-index: 5;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      margin-top: var(--ui-space-4);
      padding: var(--ui-space-3) var(--ui-space-4);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container);
      box-shadow: var(--mat-sys-level2);
      gap: var(--ui-space-3);
    }
    .action-bar__error {
      white-space: pre-line;
    }
    .action-bar__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ui-space-4);
    }
    .action-bar__summary {
      flex: 1 1 auto;
      min-width: 0;
      font: var(--mat-sys-title-small);
    }
    .action-bar__problem {
      display: flex;
      margin: 0;
      color: var(--mat-sys-error);
      font: var(--mat-sys-body-medium);
      align-items: center;
      gap: var(--ui-space-1);
    }
    .action-bar__problem:empty {
      display: none;
    }
    .action-bar__problem mat-icon {
      flex: none;
      width: var(--ui-space-5);
      height: var(--ui-space-5);
      font-size: var(--ui-space-5);
    }
    .submit-btn {
      flex: none;
    }
    @media (width >= 600px) {
      mat-card-content {
        padding: var(--ui-space-6);
      }
      .fields {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .fields__title {
        grid-column: 1 / -1;
      }
    }
  `,
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
    ToTitleCasePipe,
    MatIcon,
    MatIconButton,
    MatDivider,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    EmptyStateComponent,
    EmptyStateActionsDirective,
    MessageComponent,
  ],
  providers: [provideBuilderFormFieldDefaults()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditBuilderComponent implements OnInit {
  public submitAudit = output<AuditDetails>();
  public readonly modified = output<AuditDetails>();
  public readonly forked = output<void>();
  initialAudit = input.required<AuditDetails>();
  protected readonly DEVICE_TYPES: readonly string[] = DEVICE_OPTIONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly injector = inject(Injector);
  public readonly modifying = input.required<boolean>();
  public readonly primaryAction = input<'analyze' | 'fork' | 'none'>('analyze');
  public readonly submittingRequest = input(false);
  /** Why the last run was rejected, shown beside the button that started it. */
  public readonly errorMessage = input<string | null>(null);
  public readonly collapseSteps = input(false);
  protected readonly stepExpanded = computed(() => !this.collapseSteps());
  /** Set once a run was tried with something missing; from then on steps and the bar show what blocks it. */
  protected readonly attempted = signal(false);
  private readonly stepComponents = viewChildren(AuditStepComponent);

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

  /** Appends a step and moves focus to its type, which is the first thing to choose. */
  protected addStep(): void {
    this.formGroup.addStepAt(this.formGroup.controls.steps.length);
    afterNextRender(
      () => {
        const steps = this.host.nativeElement.querySelectorAll<HTMLElement>('ui-audit-builder-step');
        steps
          .item(steps.length - 1)
          ?.querySelector<HTMLElement>('mat-select')
          ?.focus();
      },
      { injector: this.injector },
    );
  }

  protected submitCurrentAudit(): void {
    if (
      this.primaryAction() !== 'analyze' ||
      !this.modifying() ||
      this.submittingRequest() ||
      !this.formGroup.enabled
    ) {
      return;
    }

    if (this.problem() !== null) {
      this.revealProblems();
      return;
    }

    this.attempted.set(false);
    this.submitAudit.emit(this.auditValue());
  }

  /** What blocks the run, in the order it has to be fixed, or null when the audit can run. */
  protected problem(): string | null {
    const steps = this.formGroup.controls.steps.controls;

    if (steps.length === 0) return 'Add a step';
    if (
      this.formGroup.controls.title.invalid ||
      this.formGroup.controls.device.invalid ||
      this.formGroup.controls.timeout.invalid ||
      steps.some((step) => step.invalid || step.selectionControl.invalid)
    ) {
      return 'Fix the highlighted fields';
    }
    // The schema rejects an audit that measures nothing.
    if (!steps.some((step) => AUDIT_STEP_TYPES.has(step.selectionControl.value))) return 'Add an audit step';
    return null;
  }

  /** Marks every problem, opens the steps that have one and moves focus to the first thing to fix. */
  private revealProblems(): void {
    this.attempted.set(true);
    this.formGroup.markAllAsTouched();
    this.formGroup.controls.steps.controls.forEach((step) => step.selectionControl.markAsTouched());
    this.stepComponents().forEach((step) => step.openIfInvalid());

    afterNextRender(
      () => {
        const host = this.host.nativeElement;
        const target =
          host.querySelector<HTMLElement>('input.ng-invalid, mat-select.ng-invalid') ??
          host.querySelector<HTMLElement>('.steps__add');
        target?.focus();
      },
      { injector: this.injector },
    );
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
