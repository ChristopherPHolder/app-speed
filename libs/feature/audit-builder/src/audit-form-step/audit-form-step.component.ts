import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { StepFormGroup } from '../audit-builder/audit-builder.types';

import { STEP_TYPES } from '../audit-builder/audit-builder.constants';

@Component({
  selector: 'lib-audit-form-step',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatInputModule, ReactiveFormsModule, MatAutocompleteModule, MatMenuModule, MatIconModule, MatButtonModule],
  templateUrl: './audit-form-step.component.html',
  styleUrls: ['./audit-form-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditFormStepComponent {
  @Input() stepFormGroup!: FormGroup<StepFormGroup>;
  @Output() valueChange = new EventEmitter();
  // protected readonly STEP_TYPES_VALIDATOR_PATTERN = STEP_TYPES_VALIDATOR_PATTERN;
  protected readonly STEP_TYPES = STEP_TYPES;

  public getStepControlsKeys(stepFormGroup: any) {
    return Object.keys(stepFormGroup.controls);
  }
  getControl(stepFormGroup: any, controlKey: any) {
    return stepFormGroup.get(controlKey) as FormControl;
  }
  isValueControl(control: FormControl) {
    return typeof control.value === 'string';
  }
  public filteredOptions(options: string[], value: string) {
    const filterValue = value.toLowerCase();
    return options.filter(option => option.toLowerCase().includes(filterValue));
  }
}
