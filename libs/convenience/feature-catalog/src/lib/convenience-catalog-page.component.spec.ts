import { TestBed } from '@angular/core/testing';
import { ConvenienceCatalogPageComponent } from './convenience-catalog-page.component';

describe('ConvenienceCatalogPageComponent', () => {
  it('presents the trace tool category', async () => {
    await TestBed.configureTestingModule({ imports: [ConvenienceCatalogPageComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ConvenienceCatalogPageComponent);

    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Convenience tools');
    expect(element.textContent).toContain('Trace tools');
    expect(element.textContent).toContain('Screenshots');
    expect(element.textContent).toContain('Filmstrips');
    expect(element.textContent).toContain('GIFs');
  });
});
