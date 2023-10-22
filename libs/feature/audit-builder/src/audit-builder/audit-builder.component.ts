import { ChangeDetectionStrategy, Component, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { tap } from 'rxjs/operators';
import { FormArray, FormControl, FormControlOptions, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DEVICE_TYPES, stepNameTypes, StepType } from './data';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { preventDefault, RxActionFactory, RxActions } from '@rx-angular/state/actions';
import { RxEffects } from '@rx-angular/state/effects';
import { filter, map, withLatestFrom } from 'rxjs';


interface AuditDetails  {
  title: string;
  device: DeviceOption;
  timeout: number
  steps: []
};

type UiActions = {
  inputChange: string;
  formSubmit: Event;
  formClick: Event;
}

interface StepFormGroup {
  type: FormControl<StepType | string>;
}

type DeviceOption = 'mobile' | 'tablet' | 'desktop'

interface AuditBuilder {
  title: FormControl<string>;
  device: FormControl<DeviceOption>;
  timeout: FormControl<number>;
  steps: FormArray<FormGroup<StepFormGroup>>;
}

@Component({
  selector: 'lib-audit-builder',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatMenuModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatExpansionModule,
  ],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class AuditBuilderComponent extends RxEffects implements OnInit {
  @Input({required: true}) set auditDetails(details: AuditDetails) {
    this.auditBuilderForm.controls.title.setValue(details.title);
    this.auditBuilderForm.controls.device.setValue(details.device);
    this.auditBuilderForm.controls.timeout.setValue(details.timeout);
    this.updateAuditSteps(details.steps);
  }

  updateAuditSteps(steps: []) {
    const formSteps = this.auditBuilderForm.controls.steps;
    if (JSON.stringify(formSteps.getRawValue()) === JSON.stringify(steps)) {
      return;
    }
    formSteps.clear();
    steps.forEach((step, index) => this.addStep(index, step));
  }

  ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: String,
    formSubmit: preventDefault
  });

  public readonly deviceTypes = DEVICE_TYPES;

  private readonly stepTypes = stepNameTypes;
  public readonly stepTypeValidatorPattern = `^(${this.stepTypes.join('|')})$`;
  private readonly baseFormControlOptions:  FormControlOptions & {nonNullable: true} = {
    validators: [Validators.required],
    nonNullable: true
  };
  public readonly auditBuilderForm = new FormGroup<AuditBuilder>({
    title: new FormControl('', this.baseFormControlOptions),
    device: new FormControl('mobile', this.baseFormControlOptions),
    timeout: new FormControl(30000, this.baseFormControlOptions),
    steps: new FormArray<any>([])
  });

  filteredOptions(value: string) {
    const filterValue = value.toLowerCase();
    return this.stepTypes.filter(option => option.toLowerCase().includes(filterValue));
  }

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.auditBuilderForm.statusChanges,this.auditBuilderForm.valueChanges),
    filter(([,formState,]) => formState === 'VALID'),
    map(([,, formValue]) => formValue)
  )

  @Output() auditInputChange = this.ui.inputChange$.pipe(
    withLatestFrom(this.auditBuilderForm.statusChanges,this.auditBuilderForm.valueChanges),
    map(([,, formValue]) => formValue)
  )

  inputChange$ = this.auditBuilderForm.valueChanges.pipe(
    tap(input => this.ui.inputChange(JSON.stringify(input)))
  );

  ngOnInit() {
    this.inputChange$.subscribe()
  }

  private createFormGroup(data: any): FormGroup {
    const group: any = {};

    Object.keys(data).forEach(key => {
      if (data[key] instanceof Array) {
        group[key] = new FormArray([]);
        data[key].forEach((item: any) => {
          (group[key] as FormArray).push(this.createFormGroup(item));
        });
      } else if (typeof data[key] === 'object') {
        group[key] = this.createFormGroup(data[key]);
      } else {
        group[key] = new FormControl(data[key], {
          validators: [Validators.required],
          nonNullable: true
        });
      }
    });

    return new FormGroup(group);
  }

  addStep(index: number, step?: any) {
    const stepFormGroup = step ? this.createFormGroup(step): new FormGroup<StepFormGroup>({
      type: new FormControl('', {
        validators: [Validators.required, Validators.pattern(this.stepTypeValidatorPattern)],
        nonNullable: true
      })
    });
    this.auditBuilderForm.controls.steps.insert(index, stepFormGroup);
  }

  private breakpointObserver = inject(BreakpointObserver);
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    tap(console.log)
  );
}
