import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { DEVICE_TYPES } from '../audit-builder/audit-builder.constants';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RxIf } from '@rx-angular/template/if';
import { RxFor } from '@rx-angular/template/for';

@Component({
  selector: 'ui-audit-global',
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
  ],
  templateUrl: './audit-globals.component.html',
  styleUrls: ['./audit-globals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditGlobalsComponent {
  @Input() title!: FormControl<string>;
  @Input() device!: FormControl<string>;
  @Input() timeout!: FormControl<number>;
  @Output() valueChange = new EventEmitter();
  protected readonly DEVICE_TYPES = DEVICE_TYPES;
}
