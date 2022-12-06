import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditFormComponent } from './audit-form/audit-form.component';

@NgModule({
  imports: [CommonModule],
  declarations: [AuditFormComponent],
  exports: [AuditFormComponent],
})
export class FormsModule {}
