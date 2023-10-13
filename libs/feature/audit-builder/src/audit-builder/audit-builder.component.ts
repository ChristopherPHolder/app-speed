import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { deviceTypes, stepNameTypes, StepType } from './data';
import { MatSelectModule } from '@angular/material/select';
import { preventDefault } from '@rx-angular/state/actions';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';

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
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  public readonly deviceTypes = deviceTypes;
  private readonly stepTypes = stepNameTypes;
  panelOpenState = false;

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
    const step = new FormGroup<StepFormGroup>({
      type: new FormControl('test', {
        validators: [Validators.required],
        nonNullable: true
      })
    })

    this.auditBuilderForm.controls.steps.insert(1, step)

    console.log('Test', this.auditBuilderForm.controls.steps)
    // this.filteredOptions = this.myControl.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(value || '')),
    // );
  }

  // private _filter(value: string): string[] {
  //   const filterValue = value.toLowerCase();
  //
  //   return this.options.filter(option => option.toLowerCase().includes(filterValue));
  // }

  removeStep(index: number) {
    this.auditBuilderForm.controls.steps.removeAt(index);
  }

  addStep(index: number) {
    console.log(index)
    const step = new FormGroup<StepFormGroup>({
      type: new FormControl(`Creation Index ${index}`, {
        validators: [Validators.required],
        nonNullable: true
      })
    })

    this.auditBuilderForm.controls.steps.insert(index, step)
  }

  onSubmit(event: any): void {
    event.preventDefault()
    alert('Thanks!');
  }

  private breakpointObserver = inject(BreakpointObserver);

  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Card 1', cols: 1, rows: 1 },
          { title: 'Card 2', cols: 1, rows: 1 },
          { title: 'Card 3', cols: 1, rows: 1 },
          { title: 'Card 4', cols: 1, rows: 1 }
        ];
      }

      return [
        { title: 'Card 1', cols: 1, rows: 1 },
        { title: 'Card 2', cols: 1, rows: 1 },
        { title: 'Card 3', cols: 1, rows: 2 },
        { title: 'Card 4', cols: 1, rows: 1 }
      ];
    })
  );
  protected readonly preventDefault = preventDefault;
}
