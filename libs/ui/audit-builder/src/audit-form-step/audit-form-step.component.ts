import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter, inject,
  Input,
  OnChanges, OnInit,
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
import { AuditStepControlService } from './audit-step-control.service';

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
  providers: [AuditStepControlService]
})
export class AuditFormStepComponent implements OnChanges, OnInit {
  @Input() stepFormGroup!: FormGroup<StepFormGroup>;
  @Output() valueChange = new EventEmitter();
  @Output() action = new EventEmitter();

  stepControl = inject(AuditStepControlService);

  private topLevelPropsCache: { name: string, control: FormControl }[] | null = null;
  protected readonly AUDIT_STEP_OPTION_GROUPS = AUDIT_STEP_OPTION_GROUPS;

  ngOnInit() {
    this.stepControl.initStep(this.stepFormGroup);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepFormGroup']) {
      this.resetCaches();
    }
  }

  resetStep(): void {
    this.stepControl.reset();
    this.valueChange.emit();
    console.log('WOLOLO');
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


  private isFormControl(control: AbstractControl | null): control is FormControl {
    return control != null && control.constructor !== FormArray && control.constructor !== FormGroup;
  }

  private resetCaches(): void {
    this.topLevelPropsCache = null;
  }
}
