import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'lib-trace-drop-zone',
  imports: [MatButton, MatIcon],
  template: `
    <div
      class="drop-zone"
      [class.drop-zone--active]="isDragging()"
      (dragenter)="startDragging($event)"
      (dragover)="startDragging($event)"
      (dragleave)="stopDragging($event)"
      (drop)="dropFile($event)"
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
      border: 2px dashed var(--mat-sys-outline-variant, #a9acae);
      border-radius: 24px;
      background:
        radial-gradient(circle at 50% 35%, rgb(11 87 208 / 6%), transparent 34%),
        var(--mat-sys-surface-container-low, #f7f8fa);
      text-align: center;
      place-items: center;
      align-content: center;
      transition:
        border-color 150ms ease,
        background 150ms ease,
        transform 150ms ease;
    }
    .drop-zone--active {
      border-color: var(--mat-sys-primary, #0b57d0);
      background: var(--mat-sys-primary-container, #dbe8ff);
      outline: none;
      transform: scale(1.01);
    }
    .drop-zone__icon {
      display: grid;
      width: 72px;
      height: 72px;
      margin-bottom: 20px;
      border-radius: 22px;
      background: var(--mat-sys-primary, #0b57d0);
      color: var(--mat-sys-on-primary, #ffffff);
      place-items: center;
    }
    .drop-zone__icon mat-icon {
      width: 36px;
      height: 36px;
      font-size: 36px;
    }
    h2 {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface, #1f1f1f);
      font: var(--mat-sys-headline-small, 600 1.4rem/1.8rem Roboto, sans-serif);
    }
    p {
      margin: 0 0 24px;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-body-large, 400 1rem/1.5rem Roboto, sans-serif);
    }
    .drop-zone__hint {
      margin-top: 16px;
      color: var(--mat-sys-on-surface-variant, #444746);
      font: var(--mat-sys-label-medium, 500 0.75rem/1rem Roboto, sans-serif);
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
  protected readonly isDragging = signal(false);

  protected startDragging(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  protected stopDragging(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  protected dropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files.item(0);
    if (file) this.fileSelected.emit(file);
  }

  protected chooseFile(event: Event): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.item(0);
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }
}
