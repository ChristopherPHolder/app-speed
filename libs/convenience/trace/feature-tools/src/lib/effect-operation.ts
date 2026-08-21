import { DestroyRef, Signal, computed, inject, signal } from '@angular/core';
import { Cause, Effect, Exit, Option } from 'effect';

export type EffectOperationState<A, F> =
  | { readonly status: 'idle' }
  | { readonly status: 'running'; readonly label: string }
  | { readonly status: 'success'; readonly value: A }
  | { readonly status: 'failure'; readonly label: string; readonly failure: F };

export interface EffectOperation<I, A, F> {
  readonly state: Signal<EffectOperationState<A, F>>;
  readonly result: Signal<A | undefined>;
  readonly failure: Signal<F | undefined>;
  readonly isRunning: Signal<boolean>;
  run(input: I): void;
  cancel(): void;
  reset(): void;
}

export interface EffectOperationOptions<I, A, E, F> {
  readonly execute: (input: I) => Effect.Effect<A, E>;
  readonly label: (input: I) => string;
  readonly presentFailure: (error: E) => F;
  readonly unexpectedFailure: (cause: Cause.Cause<unknown>) => F;
  readonly onSuccess?: (value: A) => void;
}

/**
 * Bridges a caller-owned Effect into Angular signals with one latest-wins
 * cancellation policy. It is intentionally created in an injection context so
 * every operation is interrupted with its owning view.
 */
export function createEffectOperation<I, A, E, F>(
  options: EffectOperationOptions<I, A, E, F>,
): EffectOperation<I, A, F> {
  const destroyRef = inject(DestroyRef);
  const writableState = signal<EffectOperationState<A, F>>({ status: 'idle' });
  let generation = 0;
  let controller: AbortController | undefined;

  const interrupt = (): void => {
    generation += 1;
    controller?.abort();
    controller = undefined;
  };

  destroyRef.onDestroy(interrupt);

  return {
    state: writableState.asReadonly(),
    result: computed(() => {
      const state = writableState();
      return state.status === 'success' ? state.value : undefined;
    }),
    failure: computed(() => {
      const state = writableState();
      return state.status === 'failure' ? state.failure : undefined;
    }),
    isRunning: computed(() => writableState().status === 'running'),
    run(input): void {
      interrupt();
      const currentGeneration = generation;
      const currentController = new AbortController();
      const label = options.label(input);
      controller = currentController;
      writableState.set({ status: 'running', label });

      void Effect.runPromiseExit(options.execute(input), { signal: currentController.signal }).then((exit) => {
        if (currentGeneration !== generation || currentController.signal.aborted) return;
        controller = undefined;

        if (Exit.isSuccess(exit)) {
          try {
            options.onSuccess?.(exit.value);
            writableState.set({ status: 'success', value: exit.value });
          } catch (error) {
            writableState.set({ status: 'failure', label, failure: options.unexpectedFailure(Cause.die(error)) });
          }
          return;
        }

        const error = Cause.findErrorOption(exit.cause);
        writableState.set({
          status: 'failure',
          label,
          failure: Option.isSome(error) ? options.presentFailure(error.value) : options.unexpectedFailure(exit.cause),
        });
      });
    },
    cancel(): void {
      interrupt();
      writableState.set({ status: 'idle' });
    },
    reset(): void {
      interrupt();
      writableState.set({ status: 'idle' });
    },
  };
}
