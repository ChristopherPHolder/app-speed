import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toTitleCase',
  standalone: true,
})
export class ToTitleCasePipe implements PipeTransform {
  transform(value: string): unknown {
    return value
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^\w|[A-Z]|\b\w/g, (word) => word.toUpperCase()); // Capitalize first character of each word
  }
}
