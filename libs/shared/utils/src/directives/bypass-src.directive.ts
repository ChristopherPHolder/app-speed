import { Directive, ElementRef, inject, Input } from '@angular/core';

// @TODO - Fix linting rule
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'iframe[bypassSrc]',
  standalone: true,
})
export class BypassSrcDirective {
  private element = inject(ElementRef);
  @Input() set bypassSrc(src: unknown) {
    if (typeof src === 'string') {
      this.element.nativeElement.src = src;
    }
  }
}
