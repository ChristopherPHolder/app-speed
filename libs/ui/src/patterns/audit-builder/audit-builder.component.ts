import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import type { AppSpeedUserFlow, AppSpeedUserFlowStep } from '@ufo/user-flow-replay';
import { preventDefault, RxActionFactory, RxActions } from '@rx-angular/state/actions';
import { filter, map, withLatestFrom } from 'rxjs';

type UiActions = {
  inputChange: string;
  formSubmit: Event;
  formClick: Event;
}

const defaultAudit: AppSpeedUserFlow = {
  title: '',
  steps: [
    {
      type: 'startNavigation',
      stepOptions: {
        name: 'Initial Navigation'
      },
    },
    {
      // This is an issue related to Puppeteer Replay
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type: 'navigate',
      url: 'https://google.com'
    },
    {
      type: 'endNavigation'
    }
  ]
};

@Component({
  selector: 'app-audit-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-builder.component.html',
  styleUrls: ['./audit-builder.component.scss', './../../component/input/input.scss', '../../component/box/box.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class AuditBuilderComponent implements AfterViewInit {
  auditForm = new FormGroup(
    {
    title: new FormControl<string>(defaultAudit.title, Validators.required),
    steps: new FormArray(defaultAudit.steps.map(step => this.createStepGroup(step)))
  });

  ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: String,
    formSubmit: preventDefault,
  });

  @Input()
  set auditDetails(details: AppSpeedUserFlow) {
    this.updateAuditForm(details);
  }

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.auditForm.statusChanges,this.auditForm.valueChanges),
    filter(([,formState,]) => formState === 'VALID'),
    map(([,, formValue]) => formValue),
  );

  private createStepGroup(step: AppSpeedUserFlowStep){
    return new FormGroup({
      type: new FormControl<string>(step.type, Validators.required)
    })
  };

  get auditSteps() {
    // TODO fix typing
    return this.auditForm.get('steps') as FormArray<FormGroup<{type: FormControl<string | null>}>>;
  }

  updateAuditForm(auditDetails?: AppSpeedUserFlow): void {
    this.auditForm.get('title')?.setValue('defaultAudit.title');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateAuditForm();
    });
  }

  protected readonly Object = Object;
}
