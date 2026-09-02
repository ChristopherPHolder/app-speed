import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ShellComponent } from './shell.component';

@Component({
  template: '',
})
class TestRouteComponent {}

describe('ShellComponent', () => {
  it('provides application landmarks and primary navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([
          { path: 'audits/history', component: TestRouteComponent },
          { path: '**', component: TestRouteComponent },
        ]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ShellComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/audits/history');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const primaryNavigation = element.querySelector('nav[aria-label="Primary navigation"]');

    expect(element.querySelectorAll('header')).toHaveLength(1);
    expect(element.querySelectorAll('main')).toHaveLength(1);
    expect(element.querySelector('main')?.id).toBe('main-content');
    expect(element.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(element.querySelector('.brand')?.getAttribute('href')).toBe('/');
    expect(Array.from(primaryNavigation?.querySelectorAll('a') ?? [], (link) => link.textContent?.trim())).toEqual([
      'Run audit',
      'Audit history',
      'Trace tools',
    ]);
    expect(primaryNavigation?.querySelector('[aria-current="page"]')?.textContent).toContain('Audit history');
  });
});
