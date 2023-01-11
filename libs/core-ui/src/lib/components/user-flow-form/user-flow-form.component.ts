import { ChangeDetectionStrategy, Component, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxActionFactory, preventDefault } from '@rx-angular/state/actions';
import { filter, map, Observable, withLatestFrom } from 'rxjs';
import { RxEffects } from '@rx-angular/state/effects';

type UiActions = {
  inputChange: string;
  formSubmit: Event;
  formClick: Event;
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-user-flow-form',
  template: `
    <form 
      [formGroup]='userflowForm' 
      class='audit-form'
      (ngSubmit)="ui.formSubmit($event)"
    >
      <input 
        class='audit-input-text' 
        formControlName='url' 
        placeholder='Enter a web page URL to audit'
      >
      <button
        class='audit-input-btn' 
        type='submit'
      >Run Audit</button>
    </form>
  `,
  styleUrls: ['./user-flow-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxActionFactory],
})
export class UserFlowFormComponent extends RxEffects {
  private readonly urlValidatorPattern = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';
  userflowForm: FormGroup = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(this.urlValidatorPattern)]]
  });

  @Input()
  set disabled(disabled$: Observable<boolean>) {
    this.register(disabled$, d => d ? this.userflowForm.enable() : this.userflowForm.disable());
  }

  constructor(
    private fb: FormBuilder,
    private actions: RxActionFactory<UiActions>,
  ) {
    super();
  }

  ui = this.actions.create({
    inputChange: String,
    formSubmit: preventDefault,
  });

  @Output() auditSubmit = this.ui.formSubmit$.pipe(
    withLatestFrom(this.userflowForm.statusChanges,this.userflowForm.valueChanges),
    // @TODO fix unused vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter(([submitEvent, formState, formValue]) => formState === 'VALID'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    map(([submitEvent, formState, formValue]) => formValue.url)
  );
}
