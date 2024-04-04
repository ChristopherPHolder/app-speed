import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'kibibytes',
  standalone: true,
})
export class KibibytesPipe implements PipeTransform {
  transform(bytes: number): number {
    return Math.round(bytes / 1024);
  }
}
