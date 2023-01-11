import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  standalone: true,
  selector: 'iframe[bypassSrc]',
})
export class BypassSrcDirective {
  @Input() set bypassSrc(src: unknown) {
    if (typeof src === 'string') {
      this.element.nativeElement.src = src;
    }
  }

  constructor(private element: ElementRef) {}
}

