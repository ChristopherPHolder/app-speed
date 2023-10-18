import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
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

interface StepFormGroup {
  type: FormControl<StepType | string>;
}

interface AuditBuilder {
  title: FormControl<string>;
  device: FormControl<'mobile' | 'tablet' | 'desktop'>;
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
})
export class AuditBuilderComponent implements OnInit {
  @Input({required: true}) details!: { title: string; device: string; timeout: string };

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

  ngOnInit() {
    this.addStep(0);
    this.addStep(0);
    this.addStep(0);
    this.cards.subscribe(console.log)
  }

  addStep(index: number) {
    this.auditBuilderForm.controls.steps.insert(index, new FormGroup<StepFormGroup>({
      type: new FormControl('', {
        validators: [Validators.required, Validators.pattern(this.stepTypeValidatorPattern)],
        nonNullable: true
      })
    }))
  }

  onSubmit(event: any): void {
    event.preventDefault()
    alert('Thanks!');
  }

  private breakpointObserver = inject(BreakpointObserver);
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    tap(console.log)
  );
}
