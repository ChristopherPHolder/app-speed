import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import type { AuditStep } from '@app-speed/audit/domain';
import { ContractStepFormGroup } from '../contract-step-form';
import { getContractStepPresentation } from '../contract-step-presentation';
import { ContractStepFieldsComponent } from './contract-step-fields.component';

@Component({
  selector: 'builder-contract-step',
  standalone: true,
  imports: [
    JsonPipe,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatIcon,
    ContractStepFieldsComponent,
  ],
  template: `
    <mat-expansion-panel [expanded]="true">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <span class="step-title">
            <mat-icon [svgIcon]="presentation().icon" aria-hidden="true" class="step-title__icon" />
            <span>{{ presentation().label }}</span>
          </span>
        </mat-panel-title>
      </mat-expansion-panel-header>

      <builder-contract-step-fields
        [variantId]="variantId()"
        [fields]="form().contract.fields"
        [control]="form()"
        [stepForm]="form()"
      />

      @if (showPreview()) {
        <pre class="step-preview">{{ form().getRawValue() | json }}</pre>
      }
    </mat-expansion-panel>
  `,
  styles: `
    .step-title {
      display: inline-flex;
      align-items: center;
      gap: 12px;
    }

    .step-title__icon {
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
    }

    .step-preview {
      margin: 24px 0 0;
      padding: 16px;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.04);
      overflow: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractStepComponent {
  readonly variantId = input.required<string>();
  readonly value = input<Record<string, unknown> | AuditStep | undefined>(undefined);
  readonly showPreview = input(false);

  protected readonly presentation = computed(() => getContractStepPresentation(this.variantId()));
  protected readonly form = computed(() => new ContractStepFormGroup(this.variantId(), this.value() as Record<string, unknown> | undefined));
}
