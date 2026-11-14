import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProseComponent } from './prose.component';

@Component({
  imports: [ProseComponent],
  template: `
    <ui-prose>
      <h2>Section</h2>
      <p>Body text with a <a href="/elsewhere">link</a>.</p>
      <div class="ui-prose-table">
        <table>
          <tr>
            <td>Cell</td>
          </tr>
        </table>
      </div>
    </ui-prose>
  `,
})
class HostComponent {}

describe('ProseComponent', () => {
  it('renders projected reading content unchanged', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const prose = (fixture.nativeElement as HTMLElement).querySelector('ui-prose');

    expect(prose?.querySelector('h2')?.textContent).toBe('Section');
    expect(prose?.querySelector('a')?.getAttribute('href')).toBe('/elsewhere');
    expect(prose?.querySelector('.ui-prose-table table')).not.toBeNull();
  });
});
