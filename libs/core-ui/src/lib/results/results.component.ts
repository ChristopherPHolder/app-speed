import { Component, Input, ViewEncapsulation } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ResultsComponent {
  @Input() loading?: boolean;
  @Input() toastText?: string | null;
  @Input() htmlReportUrl?:  SafeResourceUrl;

}
