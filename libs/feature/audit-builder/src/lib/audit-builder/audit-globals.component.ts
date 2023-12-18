import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';
import { DEVICE_TYPE } from '../schema/audit-builder.constants';
import { ToTitleCasePipe } from '../utils/toTitleCase.pipe';
import { AuditBuilderService } from './audit-builder.service';

@Component({
  selector: 'lib-audit-global',
  standalone: true,
  imports: [
    RxIf,
    RxFor,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    ToTitleCasePipe,
  ],
  templateUrl: './audit-globals.component.html',
  styleUrls: ['./audit-globals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditGlobalsComponent {
  @Output() valueChange = new EventEmitter();

  builder = inject(AuditBuilderService)
  protected readonly DEVICE_TYPES = Object.values(DEVICE_TYPE);
}
