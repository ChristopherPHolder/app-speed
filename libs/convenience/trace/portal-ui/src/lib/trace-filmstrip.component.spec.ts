import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { defaultTraceFilmstripSettings } from '@app-speed/convenience/trace/domain';
import { TraceFilmstripComponent, type TraceFilmstripUiFrame } from './trace-filmstrip.component';

const frames: ReadonlyArray<TraceFilmstripUiFrame> = [
  {
    source: 'data:image/png;base64,first',
    sourceIndex: 0,
    displayTimestampMicroseconds: 0,
    offsetMilliseconds: 0,
    deltaMilliseconds: 0,
  },
  {
    source: 'data:image/png;base64,second',
    sourceIndex: 1,
    displayTimestampMicroseconds: 125_000,
    offsetMilliseconds: 125,
    deltaMilliseconds: 125,
  },
];

describe('TraceFilmstripComponent', () => {
  it('renders counts, lazy thumbnails, timestamps, and deltas', async () => {
    await TestBed.configureTestingModule({
      imports: [TraceFilmstripComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TraceFilmstripComponent);
    fixture.componentRef.setInput('frames', frames);
    fixture.componentRef.setInput('sourceFrameCount', 4);
    fixture.componentRef.setInput('durationMilliseconds', 500);
    fixture.componentRef.setInput('settings', { ...defaultTraceFilmstripSettings, useFixedInterval: false });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('4 source frames');
    expect(element.textContent).toContain('2 displayed frames');
    expect(element.textContent).toContain('500.0 ms trace duration');
    expect(element.textContent).toContain('+125.0 ms');
    expect(element.querySelectorAll('button')).toHaveLength(2);
    expect(element.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it('shows overflow fades only where more frames are hidden', async () => {
    await TestBed.configureTestingModule({
      imports: [TraceFilmstripComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TraceFilmstripComponent);
    fixture.componentRef.setInput('frames', frames);
    fixture.componentRef.setInput('sourceFrameCount', 2);
    fixture.componentRef.setInput('durationMilliseconds', 125);
    fixture.componentRef.setInput('settings', defaultTraceFilmstripSettings);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const track = element.querySelector<HTMLElement>('.track');
    const shell = element.querySelector<HTMLElement>('.track-shell');
    expect(track).not.toBeNull();
    if (!track) return;
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 100 },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollWidth: { configurable: true, value: 300 },
    });
    track.querySelector('img')?.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(shell?.classList.contains('has-overflow-left')).toBe(false);
    expect(shell?.classList.contains('has-overflow-right')).toBe(true);

    track.scrollLeft = 200;
    track.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    expect(shell?.classList.contains('has-overflow-left')).toBe(true);
    expect(shell?.classList.contains('has-overflow-right')).toBe(false);
  });

  it('opens an accessible keyboard-navigable preview and restores focus', async () => {
    await TestBed.configureTestingModule({
      imports: [TraceFilmstripComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TraceFilmstripComponent);
    fixture.componentRef.setInput('frames', frames);
    fixture.componentRef.setInput('sourceFrameCount', 2);
    fixture.componentRef.setInput('durationMilliseconds', 125);
    fixture.componentRef.setInput('settings', defaultTraceFilmstripSettings);
    await fixture.whenStable();

    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button');
    trigger?.focus();
    trigger?.click();
    await fixture.whenStable();

    expect(trigger?.getAttribute('aria-pressed')).toBe('true');

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.textContent).toContain('1 of 2');
    expect((document.activeElement as HTMLElement | null)?.getAttribute('aria-label')).toBe('Close frame preview');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(dialog?.textContent).toContain('2 of 2');
    const filmstripButtons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.track button',
    );
    expect(filmstripButtons[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(filmstripButtons[1]?.getAttribute('aria-pressed')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
    await fixture.whenStable();
    expect(document.querySelector<HTMLElement>('.cdk-overlay-pane')?.style.width).toBe('100vw');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
