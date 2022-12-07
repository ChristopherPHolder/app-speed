import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditFormComponent } from './audit-form/audit-form.component';
import { FormsModule as AngularForms } from '@angular/forms';


@NgModule({
  imports: [CommonModule, AngularForms],
  declarations: [AuditFormComponent],
  exports: [AuditFormComponent],
})
export class FormsModule {}
