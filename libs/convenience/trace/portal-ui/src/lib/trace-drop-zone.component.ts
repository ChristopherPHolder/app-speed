import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TraceFileDropDirective } from './trace-file-drop.directive';

@Component({
  selector: 'lib-trace-drop-zone',
  imports: [MatButton, MatIcon, TraceFileDropDirective],
  template: `
    <div
      class="drop-zone"
      libTraceFileDrop
      #drop="traceFileDrop"
      [class.drop-zone--active]="drop.active()"
      (fileDropped)="fileSelected.emit($event)"
    >
      <div class="drop-zone__icon"><mat-icon aria-hidden="true">upload_file</mat-icon></div>
      <h2>Drop your Chrome trace here</h2>
      <p>The trace stays in this browser. Nothing is uploaded.</p>
      <button mat-flat-button type="button" (click)="fileInput.click()">
        <mat-icon aria-hidden="true">folder_open</mat-icon>
        Choose trace
      </button>
      <span class="drop-zone__hint">.json or .trace</span>
      <input
        #fileInput
        class="visually-hidden"
        type="file"
        accept=".json,.trace,application/json"
        (change)="chooseFile($event)"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .drop-zone {
      display: grid;
      min-height: 330px;
      padding: 40px 24px;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-extra-large);
      background: var(--mat-sys-surface-container-low);
      text-align: center;
      place-items: center;
      align-content: center;
      transition:
        border-color var(--ui-motion-duration-short3) var(--ui-motion-easing-standard),
        background-color var(--ui-motion-duration-short3) var(--ui-motion-easing-standard);
    }
    .drop-zone--active {
      border-color: var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
      outline: none;
    }
    .drop-zone__icon {
      display: grid;
      width: 72px;
      height: 72px;
      margin-bottom: 20px;
      border-radius: var(--mat-sys-corner-large);
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      place-items: center;
    }
    .drop-zone__icon mat-icon {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }
    h2 {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-headline-small);
    }
    p {
      margin: 0 0 24px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
    }
    .drop-zone__hint {
      margin-top: 16px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceDropZoneComponent {
  readonly fileSelected = output<File>();

  protected chooseFile(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.item(0);
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }
}
