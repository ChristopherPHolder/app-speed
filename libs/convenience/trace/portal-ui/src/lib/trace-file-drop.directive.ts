import { Directive, effect, input, output, signal } from '@angular/core';

@Directive({
  selector: '[libTraceFileDrop]',
  exportAs: 'traceFileDrop',
  host: {
    '(dragenter)': 'enter($event)',
    '(dragover)': 'over($event)',
    '(dragleave)': 'leave($event)',
    '(drop)': 'drop($event)',
    '(dragend)': 'end()',
  },
})
export class TraceFileDropDirective {
  readonly enabled = input(true, { alias: 'libTraceFileDropEnabled' });
  readonly fileDropped = output<File>();
  readonly active = signal(false);

  private dragDepth = 0;

  constructor() {
    effect(() => {
      if (!this.enabled()) this.reset();
    });
  }

  protected enter(event: DragEvent): void {
    if (!this.acceptsFiles(event)) return;
    this.claim(event);
    this.dragDepth += 1;
    this.active.set(true);
  }

  protected over(event: DragEvent): void {
    if (!this.acceptsFiles(event)) return;
    this.claim(event);
  }

  protected leave(event: DragEvent): void {
    if (!this.active()) return;
    this.claim(event);
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.active.set(false);
  }

  protected drop(event: DragEvent): void {
    if (!this.enabled()) {
      this.reset();
      return;
    }
    if (!this.active() && !this.hasFileType(event)) return;
    this.claim(event);
    const file = event.dataTransfer?.files.item(0);
    this.reset();
    if (file) this.fileDropped.emit(file);
  }

  protected end(): void {
    this.reset();
  }

  private acceptsFiles(event: DragEvent): boolean {
    return this.enabled() && this.hasFileType(event);
  }

  private hasFileType(event: DragEvent): boolean {
    return event.dataTransfer?.types.includes('Files') ?? false;
  }

  private claim(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private reset(): void {
    this.dragDepth = 0;
    this.active.set(false);
  }
}
