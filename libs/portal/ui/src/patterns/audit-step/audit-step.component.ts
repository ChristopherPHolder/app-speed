import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { AppSpeedUserFlowStep } from '@app-speed/shared-utils';
import { KebabMenuComponent } from '../../component/icons/kebab-menu.component';

@Component({
  selector: 'ui-audit-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, KebabMenuComponent],
  templateUrl: './audit-step.component.html',
  styleUrls: ['./audit-step.component.scss', './../../component/input/input.scss', '../../component/box/box.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepComponent {
  @Input({ required: true }) set stepDetails(details: AppSpeedUserFlowStep) {
    this.stepForm = this.createFormGroup(details);
  }

  @Output() addStep = new EventEmitter<'before' | 'after'>();
  @Output() removeStep = new EventEmitter<void>();

  @ViewChild('editDialog') editDialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('editStepButton') editStepRef!: ElementRef<HTMLElement>;

  openEditToggle() {
    const buttonRect: DOMRect = this.editStepRef.nativeElement.getBoundingClientRect();
    const dialog: HTMLDialogElement = this.editDialogRef.nativeElement;
    dialog.style.visibility = 'hidden';
    !dialog.open ? dialog.show() : dialog.close();
    dialog.style.top = `${buttonRect.bottom + 4}px`;
    dialog.style.left = `${buttonRect.right - dialog.offsetWidth}px`;
    dialog.style.visibility = 'visible';
  }

  addAuditStep(location: 'before' | 'after') {
    this.addStep.emit(location);
    this.editDialogRef.nativeElement.close();
  }

  private fb = inject(FormBuilder);
  stepForm: FormGroup = this.createFormGroup({
    type: 'Audit Step',
  } as unknown as AppSpeedUserFlowStep);

  createFormGroup(step: AppSpeedUserFlowStep): FormGroup {
    return this.fb.group(
      Object.fromEntries(
        Object.entries(step).map(([key, value]) =>
          typeof value === 'string' ? [key, [value]] : [key, [this.createFormGroup(value)]],
        ),
      ),
    );
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  isInputString(obj: any): boolean {
    return typeof obj['value'] === 'string';
  }

  get stepType() {
    return this.stepForm.controls['type'].value;
  }
}
