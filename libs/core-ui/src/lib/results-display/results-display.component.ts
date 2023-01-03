import { ChangeDetectionStrategy, Component, ViewEncapsulation, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeResourceUrl } from '@angular/platform-browser';
import { LoadingSpinnerComponentModule } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-results-display',
  templateUrl: './results-display.component.html',
  styleUrls: ['./results-display.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDisplayComponent {
  @Input() toastText?: string | null;
  @Input() loading?: boolean;
  @Input() htmlReportUrl?: SafeResourceUrl;

}

@NgModule({
  imports: [CommonModule, LoadingSpinnerComponentModule],
  declarations: [ResultsDisplayComponent],
  exports: [ResultsDisplayComponent],
})
export class ResultsDisplayComponentModule {}
