import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConvenienceCatalogPageComponent } from './convenience-catalog-page.component';

describe('ConvenienceCatalogPageComponent', () => {
  it('presents direct links to the available local trace workflows', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvenienceCatalogPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConvenienceCatalogPageComponent);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Turn a Chrome trace into useful visuals');
    expect(element.textContent).toContain('Nothing is uploaded');
    expect(element.textContent).toContain('Extract screenshots');
    expect(element.textContent).toContain('Build a filmstrip');
    expect(element.textContent).toContain('Compare filmstrips');
    expect(element.textContent).not.toContain('GIF');
    expect(Array.from(element.querySelectorAll('a'), (link) => link.getAttribute('href'))).toEqual([
      '/convenience/trace/screenshots',
      '/convenience/trace/filmstrip',
      '/convenience/trace/filmstrip/compare',
    ]);
  });
});
