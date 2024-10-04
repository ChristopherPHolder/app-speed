import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const mdAnkerRegex = /(\[([^\]]+)])\(([^)]+)\)/g;
const mdAnkerReplacer = '<a target="_blank" href="$3">$2</a>'

@Pipe({
  name: 'mdToAnker',
  standalone: true,
})
export class MdToAnkerPipe implements PipeTransform {
  private readonly bypassSecurityTrustHtml = inject(DomSanitizer).bypassSecurityTrustHtml;
  transform(value: string): SafeHtml {
    return this.bypassSecurityTrustHtml(value.replaceAll(mdAnkerRegex, mdAnkerReplacer));
  }
}
