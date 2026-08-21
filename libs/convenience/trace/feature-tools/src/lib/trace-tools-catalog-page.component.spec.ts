import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TraceToolsCatalogPageComponent } from './trace-tools-catalog-page.component';

describe('TraceToolsCatalogPageComponent', () => {
  it('links both available trace tools', async () => {
    await TestBed.configureTestingModule({
      imports: [TraceToolsCatalogPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(TraceToolsCatalogPageComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Trace tools');
    expect(element.textContent).toContain('Screenshots');
    expect(element.textContent).toContain('Filmstrip');
    expect([...element.querySelectorAll('a')].map((anchor) => anchor.getAttribute('href'))).toEqual([
      '/convenience',
      '/convenience/trace/screenshots',
      '/convenience/trace/filmstrip',
    ]);
  });
});
