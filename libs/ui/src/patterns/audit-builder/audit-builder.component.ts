import { ChangeDetectionStrategy, Component, inject, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { AppSpeedUserFlow } from '@ufo/user-flow-replay';
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
export class AuditBuilderComponent {
  private formBuilder = inject(FormBuilder);
  userflowForm: FormGroup = this.formBuilder.group(
    {
      title: ['']
    }
  );

  ui: RxActions<UiActions> = inject(RxActionFactory<UiActions>).create({
    inputChange: String,
    formSubmit: preventDefault,
  });

  @Input()
  set auditDetails(details: AppSpeedUserFlow) {
    this._auditDetails = details;
  }

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.userflowForm.statusChanges,this.userflowForm.valueChanges),
    filter(([,formState,]) => formState === 'VALID'),
    map(([,, formValue]) => formValue),
  );

  get auditSteps() {
    return this._auditDetails.steps;
  };

  private _auditDetails: AppSpeedUserFlow = defaultAudit;
  protected readonly Object = Object;
}
