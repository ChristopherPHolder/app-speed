import { Directive, ElementRef, Input } from '@angular/core';

// @TODO - Fix linting rule
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'iframe[bypassSrc]',
  standalone: true,
})
export class BypassSrcDirective {
  constructor(private element: ElementRef) {}
  @Input() set bypassSrc(src: unknown) {
    if (typeof src === 'string') {
      this.element.nativeElement.src = src;
    }
  }
}
