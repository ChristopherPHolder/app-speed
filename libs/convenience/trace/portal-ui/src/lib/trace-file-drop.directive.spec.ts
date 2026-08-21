import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TraceFileDropDirective } from './trace-file-drop.directive';

@Component({
  imports: [TraceFileDropDirective],
  template: `
    <div
      libTraceFileDrop
      #drop="traceFileDrop"
      [libTraceFileDropEnabled]="enabled()"
      [class.active]="drop.active()"
      (fileDropped)="files.push($event)"
    >
      <span></span>
    </div>
  `,
})
class TestHostComponent {
  readonly enabled = signal(true);
  readonly files: Array<File> = [];
}

const dragEvent = (type: string, types: ReadonlyArray<string>, files: ReadonlyArray<File> = []): DragEvent => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types,
      files: { item: (index: number) => files[index] ?? null },
    },
  });
  return event as DragEvent;
};

describe('TraceFileDropDirective', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      surface: fixture.nativeElement.querySelector('div') as HTMLElement,
      child: fixture.nativeElement.querySelector('span') as HTMLElement,
    };
  };

  it('stays active until nested drag entries have all left', async () => {
    const { fixture, surface, child } = await setup();

    surface.dispatchEvent(dragEvent('dragenter', ['Files']));
    child.dispatchEvent(dragEvent('dragenter', ['Files']));
    child.dispatchEvent(dragEvent('dragleave', ['Files']));
    fixture.detectChanges();
    expect(surface.classList).toContain('active');

    surface.dispatchEvent(dragEvent('dragleave', ['Files']));
    fixture.detectChanges();
    expect(surface.classList).not.toContain('active');
  });

  it('ignores non-file drags', async () => {
    const { surface } = await setup();
    const event = dragEvent('dragenter', ['text/plain']);

    surface.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(surface.classList).not.toContain('active');
  });

  it('does not claim or emit drops while disabled', async () => {
    const { fixture, component, surface } = await setup();
    component.enabled.set(false);
    fixture.detectChanges();
    const event = dragEvent('drop', ['Files'], [new File(['{}'], 'disabled.trace')]);

    surface.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(component.files).toEqual([]);
    expect(surface.classList).not.toContain('active');
  });

  it('emits only the first file and resets its active state after a drop', async () => {
    const { fixture, component, surface, child } = await setup();
    const first = new File(['{}'], 'first.trace');
    const second = new File(['{}'], 'second.trace');
    surface.dispatchEvent(dragEvent('dragenter', ['Files']));
    child.dispatchEvent(dragEvent('dragenter', ['Files']));

    const event = dragEvent('drop', ['Files'], [first, second]);
    child.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(component.files).toEqual([first]);
    expect(surface.classList).not.toContain('active');

    surface.dispatchEvent(dragEvent('dragleave', ['Files']));
    expect(surface.classList).not.toContain('active');
  });
});
