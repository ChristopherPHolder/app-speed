import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { FilmstripComparisonPageComponent } from './filmstrip-comparison-page.component';

const traceSource = (lastTimestamp: number) =>
  JSON.stringify({
    traceEvents: [
      {
        name: 'Screenshot',
        cat: 'disabled-by-default-devtools.screenshot',
        ts: 1_000,
        args: { snapshot: 'data:image/png;base64,iVBORfirst' },
      },
      { name: 'CaptureFrame', ts: lastTimestamp, args: { data: 'iVBORfinal' } },
    ],
  });

const choose = (input: HTMLInputElement, file: File): void => {
  Object.defineProperty(input, 'files', { configurable: true, value: { item: () => file } });
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const settle = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

describe('FilmstripComparisonPageComponent', () => {
  it('keeps both rows stacked and enables export only after each loads independently', async () => {
    await TestBed.configureTestingModule({
      imports: [FilmstripComparisonPageComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(FilmstripComparisonPageComponent);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const download = element.querySelector<HTMLButtonElement>('.comparison-actions button');

    expect(element.querySelectorAll('.row')).toHaveLength(2);
    expect(element.textContent).toContain('Trace A');
    expect(element.textContent).toContain('Trace B');
    expect(download?.disabled).toBe(true);

    const inputs = element.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const firstSource = traceSource(251_000);
    const first = new File([firstSource], 'before.json');
    Object.defineProperty(first, 'text', { value: () => Promise.resolve(firstSource) });
    const secondSource = traceSource(151_000);
    const second = new File([secondSource], 'after.json');
    Object.defineProperty(second, 'text', { value: () => Promise.resolve(secondSource) });

    const firstInput = inputs.item(0);
    choose(firstInput, first);
    await settle();
    await fixture.whenStable();
    expect(element.querySelectorAll('lib-trace-filmstrip')).toHaveLength(1);
    expect(element.textContent).toContain('before.json');
    expect(download?.disabled).toBe(true);

    const remainingInput = element.querySelector<HTMLInputElement>('input[type="file"]');
    expect(remainingInput).not.toBeNull();
    if (!remainingInput) return;
    choose(remainingInput, second);
    await settle();
    await fixture.whenStable();
    expect(element.querySelectorAll('lib-trace-filmstrip')).toHaveLength(2);
    expect(element.textContent).toContain('after.json');
    expect(download?.disabled).toBe(false);
  });
});
