import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConvenienceCatalogPageComponent } from './convenience-catalog-page.component';

describe('ConvenienceCatalogPageComponent', () => {
  it('presents the trace tool category', async () => {
    await TestBed.configureTestingModule({
      imports: [ConvenienceCatalogPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConvenienceCatalogPageComponent);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Convenience tools');
    expect(element.textContent).toContain('Trace tools');
    expect(element.textContent).toContain('Screenshots');
    expect(element.textContent).toContain('Filmstrips');
    expect(element.textContent).toContain('GIFs');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/convenience/trace/screenshots');
  });
});
