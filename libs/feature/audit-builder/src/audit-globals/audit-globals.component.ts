import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { DEVICE_TYPES } from '../audit-builder/audit-builder.constants';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'lib-audit-global',
  standalone: true,
  imports: [CommonModule, MatInputModule, ReactiveFormsModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './audit-globals.component.html',
  styleUrls: ['./audit-globals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditGlobalsComponent {
  @Input() title!: FormControl<string>;
  @Input() device!: FormControl<string>;
  @Input() timeout!: FormControl<number>;
  protected readonly DEVICE_TYPES = DEVICE_TYPES;
}
