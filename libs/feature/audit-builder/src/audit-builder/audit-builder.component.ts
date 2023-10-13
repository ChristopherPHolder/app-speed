import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { tap } from 'rxjs/operators';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { deviceTypes, stepNameTypes, StepType } from './data';
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
  public readonly deviceTypes = deviceTypes;
  private readonly stepTypes = stepNameTypes;
  public readonly stepTypeValidatorPattern = `^(${this.stepTypes.join('|')})$`;

  public readonly auditBuilderForm = new FormGroup<AuditBuilder>({
    title: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true
    }),
    device: new FormControl('mobile', {
      validators: [Validators.required],
      nonNullable: true
    }),
    timeout: new FormControl(30000, {
      validators: [Validators.required],
      nonNullable: true
    }),
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
