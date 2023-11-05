import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { RxFor } from '@rx-angular/template/for';
import { RxIf } from '@rx-angular/template/if';

import { AUDIT_STEP_OPTION_GROUPS } from './audit-form-step.constants';

import { StepFormGroup } from '../audit-builder/audit-builder.types';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ui-audit-form-step',
  standalone: true,
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatExpansionModule,
    MatInputModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatCardModule,
  ],
  templateUrl: './audit-form-step.component.html',
  styleUrls: ['./audit-form-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditFormStepComponent implements OnChanges {
  @Input() stepFormGroup!: FormGroup<StepFormGroup>;
  @Output() valueChange = new EventEmitter();
  @Output() action = new EventEmitter();

  private topLevelPropsCache: { name: string, control: FormControl }[] | null = null;
  private unusedPropertiesCache: string[] | null = null;
  protected readonly AUDIT_STEP_OPTION_GROUPS = AUDIT_STEP_OPTION_GROUPS;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepFormGroup']) {
      this.resetCaches();
    }
  }

  getTopLevelProps(): { name: string, control: FormControl }[] {
    if (this.topLevelPropsCache !== null) {
      return this.topLevelPropsCache;
    }
    this.topLevelPropsCache = Object.keys(this.stepFormGroup.controls)
      .filter(key => key !== 'type')
      .map(key => ({ name: key, control: this.stepFormGroup.get(key) as FormControl }))
      .filter(({ control }) => this.isFormControl(control));
    return this.topLevelPropsCache;
  }

  unusedProperties(): string[] | null {
    if (this.unusedPropertiesCache !== null) {
      return this.unusedPropertiesCache;
    }
    const stepProperties = this.stepProps(this.stepFormGroup.controls.type.value);
    this.unusedPropertiesCache = stepProperties?.filter(v => !Object.keys(this.stepFormGroup.controls).includes(v)) ?? null;
    return this.unusedPropertiesCache;
  }

  private isFormControl(control: AbstractControl | null): control is FormControl {
    return control != null && control.constructor !== FormArray && control.constructor !== FormGroup;
  }

  private stepProps(type: string): string[] | null {
    return this.AUDIT_STEP_OPTION_GROUPS
      .flatMap(group => group.options)
      .find(step => step.value === type)
      ?.properties?.flatMap(props => props.value) ?? null;
  }

  private resetCaches(): void {
    this.topLevelPropsCache = null;
    this.unusedPropertiesCache = null;
  }
}
