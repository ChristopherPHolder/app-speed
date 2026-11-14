import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageHeaderActionsDirective, PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent, PageHeaderActionsDirective],
  template: `
    <ui-page-header heading="Audit history" headingId="history-heading" eyebrow="Audits" description="All runs.">
      <button uiPageHeaderActions type="button">Refresh</button>
    </ui-page-header>
  `,
})
class HostComponent {}

describe('PageHeaderComponent', () => {
  it('renders the page heading as the h1 with the given id', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('h1') as HTMLElement;

    expect(heading.textContent).toBe('Audit history');
    expect(heading.id).toBe('history-heading');
  });

  it('renders the eyebrow, description and projected actions', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.ui-eyebrow')?.textContent).toBe('Audits');
    expect(element.querySelector('.description')?.textContent).toBe('All runs.');
    expect(element.querySelector('.actions button')?.textContent).toBe('Refresh');
  });

  it('omits the eyebrow and description when they are not set', () => {
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('heading', 'Projects');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.ui-eyebrow')).toBeNull();
    expect(fixture.nativeElement.querySelector('.description')).toBeNull();
  });
});
