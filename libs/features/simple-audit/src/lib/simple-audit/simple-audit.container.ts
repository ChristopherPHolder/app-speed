import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFlowFormComponent } from 'core-ui';

@Component({
  selector: 'app-simple-audit',
  standalone: true,
  imports: [CommonModule, UserFlowFormComponent],
  templateUrl: './simple-audit.container.html',
  styleUrls: ['./simple-audit.container.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleAuditContainer {}
