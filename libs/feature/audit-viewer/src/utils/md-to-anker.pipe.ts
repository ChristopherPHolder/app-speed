import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'mdToAnker',
  standalone: true,
  pure: false
})
export class MdToAnkerPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value.replaceAll(
      /(\[([^\]]+)])\(([^)]+)\)/g,
      '<a target="_blank" href="$3">$2</a>'
    ));
  }
}
