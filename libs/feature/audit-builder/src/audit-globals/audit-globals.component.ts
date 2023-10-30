import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { DEVICE_TYPES } from '../audit-builder/audit-builder.constants';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'lib-audit-global',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
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
