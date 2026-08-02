import { TestBed } from '@angular/core/testing';
import { TraceDropZoneComponent } from './trace-drop-zone.component';

describe('TraceDropZoneComponent', () => {
  it('presents local trace selection', async () => {
    await TestBed.configureTestingModule({ imports: [TraceDropZoneComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TraceDropZoneComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Drop your Chrome trace here');
    expect((fixture.nativeElement as HTMLInputElement).querySelector('input')?.accept).toContain('.trace');
  });
});
