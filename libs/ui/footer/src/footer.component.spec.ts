import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FooterComponent, FooterLinkDirective } from './footer.component';

@Component({
  imports: [FooterComponent, FooterLinkDirective],
  template: `
    <ui-footer navigationLabel="Legal">
      <a uiFooterLink href="/privacy">Privacy policy</a>
      <button uiFooterLink type="button">Cookie settings</button>
      <span>Made by Jane</span>
    </ui-footer>
  `,
})
class HostComponent {}

describe('FooterComponent', () => {
  it('projects links into a labelled navigation landmark and the rest into the note', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const footer = (fixture.nativeElement as HTMLElement).querySelector('footer');
    const navigation = footer?.querySelector('nav');

    expect(navigation?.getAttribute('aria-label')).toBe('Legal');
    expect(Array.from(navigation?.children ?? [], (item) => item.textContent)).toEqual([
      'Privacy policy',
      'Cookie settings',
    ]);
    expect(footer?.querySelector('.note')?.textContent).toBe('Made by Jane');
  });

  it('labels the navigation "Footer" by default', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Footer');
  });
});
