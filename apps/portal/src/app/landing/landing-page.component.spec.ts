import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  it('links to the primary app workflows', async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(LandingPageComponent);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Measure, understand, and improve app speed');
    expect(Array.from(element.querySelectorAll('a'), (link) => link.getAttribute('href'))).toEqual([
      '/audits/user-flow',
      '/audits/history',
      '/audits/user-flow',
      '/audits/history',
      '/convenience',
    ]);
  });
});
