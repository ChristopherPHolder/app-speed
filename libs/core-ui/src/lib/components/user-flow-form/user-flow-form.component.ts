import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-flow-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-flow-form.component.html',
  styleUrls: ['./user-flow-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFlowFormComponent {}
