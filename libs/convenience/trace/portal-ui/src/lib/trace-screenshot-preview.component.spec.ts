import { TestBed } from '@angular/core/testing';
import {
  TraceScreenshotPreviewComponent,
  type TraceScreenshotPreviewFrame,
} from './trace-screenshot-preview.component';

const frames: ReadonlyArray<TraceScreenshotPreviewFrame> = [
  {
    source: 'data:image/png;base64,first',
    file: 'screenshots/frame-0001.png',
    timestampMicroseconds: 1_000,
    offsetMilliseconds: 0,
    deltaMilliseconds: 0,
  },
  {
    source: 'data:image/png;base64,second',
    file: 'screenshots/frame-0002.png',
    timestampMicroseconds: 17_000,
    offsetMilliseconds: 16,
    deltaMilliseconds: 16,
  },
];

describe('TraceScreenshotPreviewComponent', () => {
  it('visualizes frames and navigates their timing', async () => {
    await TestBed.configureTestingModule({ imports: [TraceScreenshotPreviewComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TraceScreenshotPreviewComponent);
    fixture.componentRef.setInput('frames', frames);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Frame 1 of 2');
    expect(element.textContent).toContain('0.0 ms');

    element.querySelector<HTMLButtonElement>('button.next')?.click();
    await fixture.whenStable();

    expect(element.textContent).toContain('Frame 2 of 2');
    expect(element.textContent).toContain('16.0 ms');
    expect(element.querySelector<HTMLImageElement>('.stage > img')?.src).toContain('data:image/png;base64,second');
  });
});
