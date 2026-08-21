import { signal } from '@angular/core';
import { createFrameNavigator } from './frame-navigator';

interface Frame {
  readonly sourceIndex: number;
  readonly label: string;
}

describe('createFrameNavigator', () => {
  it('navigates within bounds and handles arrow keys', () => {
    const frames = signal<ReadonlyArray<Frame>>([
      { sourceIndex: 1, label: 'first' },
      { sourceIndex: 2, label: 'second' },
    ]);
    const navigator = createFrameNavigator({ frames, key: (frame) => frame.sourceIndex });
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });

    expect(navigator.current()?.label).toBe('first');
    expect(navigator.canPrevious()).toBe(false);
    expect(navigator.handleArrowKey(right)).toBe(true);
    expect(right.defaultPrevented).toBe(true);
    expect(navigator.current()?.label).toBe('second');
    expect(navigator.canNext()).toBe(false);

    navigator.next();
    expect(navigator.selectedIndex()).toBe(1);
    navigator.previous();
    navigator.previous();
    expect(navigator.selectedIndex()).toBe(0);
    expect(navigator.handleArrowKey(new KeyboardEvent('keydown', { key: 'f' }))).toBe(false);
  });

  it('preserves an exact duplicate selection and then its stable key when frames are resampled', () => {
    const frames = signal<ReadonlyArray<Frame>>([
      { sourceIndex: 1, label: 'first sample' },
      { sourceIndex: 1, label: 'second sample' },
      { sourceIndex: 2, label: 'third sample' },
    ]);
    const navigator = createFrameNavigator({ frames, key: (frame) => frame.sourceIndex });
    navigator.select(1);

    expect(navigator.current()?.label).toBe('second sample');
    frames.set([
      { sourceIndex: 2, label: 'new first sample' },
      { sourceIndex: 1, label: 'preserved source frame' },
    ]);

    expect(navigator.selectedIndex()).toBe(1);
    expect(navigator.current()?.label).toBe('preserved source frame');
  });

  it('resets safely when the selected key disappears or the collection is empty', () => {
    const frames = signal<ReadonlyArray<Frame>>([
      { sourceIndex: 1, label: 'first' },
      { sourceIndex: 2, label: 'second' },
    ]);
    const navigator = createFrameNavigator({ frames, key: (frame) => frame.sourceIndex, initialIndex: 1 });
    frames.set([{ sourceIndex: 3, label: 'replacement' }]);

    expect(navigator.selectedIndex()).toBe(0);
    expect(navigator.current()?.label).toBe('replacement');
    frames.set([]);
    expect(navigator.selectedIndex()).toBe(-1);
    expect(navigator.current()).toBeUndefined();
    expect(navigator.canPrevious()).toBe(false);
    expect(navigator.canNext()).toBe(false);
  });
});
