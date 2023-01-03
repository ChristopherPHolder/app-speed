import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditFormComponent } from './audit-form/audit-form.component';
import { FormsModule as AngularForms } from '@angular/forms';
import { LoadingSpinnerComponentModule, ResultsComponent } from 'core-ui';

@NgModule({
  imports: [CommonModule, AngularForms, LoadingSpinnerComponentModule],
  declarations: [AuditFormComponent, ResultsComponent],
  exports: [AuditFormComponent],
})
export class FormsModule {}
