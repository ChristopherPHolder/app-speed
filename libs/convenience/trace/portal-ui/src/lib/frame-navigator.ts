import { computed, linkedSignal, type Signal } from '@angular/core';

export type FrameNavigationKey = string | number;

export interface FrameNavigator<T> {
  readonly frames: Signal<ReadonlyArray<T>>;
  readonly selectedIndex: Signal<number>;
  readonly current: Signal<T | undefined>;
  readonly canPrevious: Signal<boolean>;
  readonly canNext: Signal<boolean>;
  select(index: number): void;
  previous(): void;
  next(): void;
  handleArrowKey(event: KeyboardEvent): boolean;
}

interface FrameSelection {
  readonly index: number;
  readonly key: FrameNavigationKey;
}

export const createFrameNavigator = <T>(options: {
  readonly frames: Signal<ReadonlyArray<T>>;
  readonly key: (frame: T) => FrameNavigationKey;
  readonly initialIndex?: number;
}): FrameNavigator<T> => {
  const initialIndex = options.initialIndex ?? 0;
  const selection = linkedSignal<ReadonlyArray<T>, FrameSelection | undefined>({
    source: options.frames,
    computation: (frames, previous) => {
      if (frames.length === 0) return undefined;
      const previousSelection = previous?.value;
      if (previousSelection) {
        const frameAtPreviousIndex = frames[previousSelection.index];
        if (frameAtPreviousIndex && options.key(frameAtPreviousIndex) === previousSelection.key) {
          return previousSelection;
        }
        const matchingIndex = frames.findIndex((frame) => options.key(frame) === previousSelection.key);
        if (matchingIndex >= 0) return { index: matchingIndex, key: previousSelection.key };
      }
      const index = Math.min(Math.max(0, previousSelection?.index ?? initialIndex), frames.length - 1);
      const frame = frames[index];
      return frame ? { index, key: options.key(frame) } : undefined;
    },
  });
  const selectedIndex = computed(() => selection()?.index ?? -1);
  const current = computed(() => options.frames()[selectedIndex()]);
  const canPrevious = computed(() => selectedIndex() > 0);
  const canNext = computed(() => selectedIndex() >= 0 && selectedIndex() < options.frames().length - 1);

  const select = (index: number): void => {
    const frame = options.frames()[index];
    if (frame) selection.set({ index, key: options.key(frame) });
  };
  const previous = (): void => {
    if (canPrevious()) select(selectedIndex() - 1);
  };
  const next = (): void => {
    if (canNext()) select(selectedIndex() + 1);
  };

  return {
    frames: options.frames,
    selectedIndex,
    current,
    canPrevious,
    canNext,
    select,
    previous,
    next,
    handleArrowKey: (event: KeyboardEvent): boolean => {
      if (event.key === 'ArrowLeft') previous();
      else if (event.key === 'ArrowRight') next();
      else return false;
      event.preventDefault();
      return true;
    },
  };
};
