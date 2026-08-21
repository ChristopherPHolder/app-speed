import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Effect } from 'effect';
import { createEffectOperation } from './effect-operation';

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('createEffectOperation', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('publishes successful values', async () => {
    const operation = TestBed.runInInjectionContext(() =>
      createEffectOperation({
        execute: (value: number) => Effect.succeed(value * 2),
        label: String,
        presentFailure: String,
        unexpectedFailure: () => 'unexpected',
      }),
    );

    operation.run(4);
    expect(operation.state()).toEqual({ status: 'running', label: '4' });
    await flush();
    expect(operation.result()).toBe(8);
  });

  it('presents typed failures', async () => {
    const operation = TestBed.runInInjectionContext(() =>
      createEffectOperation({
        execute: (value: string) => Effect.fail(value),
        label: (value) => value,
        presentFailure: (error) => `failed: ${error}`,
        unexpectedFailure: () => 'unexpected',
      }),
    );

    operation.run('trace.json');
    await flush();
    expect(operation.state()).toEqual({
      status: 'failure',
      label: 'trace.json',
      failure: 'failed: trace.json',
    });
  });

  it('keeps only the latest result', async () => {
    let finishFirst: ((value: number) => void) | undefined;
    const operation = TestBed.runInInjectionContext(() =>
      createEffectOperation({
        execute: (value: number) =>
          value === 1
            ? Effect.promise(() => new Promise<number>((resolve) => (finishFirst = resolve)))
            : Effect.succeed(value),
        label: String,
        presentFailure: String,
        unexpectedFailure: () => 'unexpected',
      }),
    );

    operation.run(1);
    operation.run(2);
    await flush();
    expect(operation.result()).toBe(2);
    finishFirst?.(1);
    await flush();
    expect(operation.result()).toBe(2);
  });

  it('does not publish a result after cancellation', async () => {
    const operation = TestBed.runInInjectionContext(() =>
      createEffectOperation({
        execute: () => Effect.succeed('done'),
        label: () => 'work',
        presentFailure: String,
        unexpectedFailure: () => 'unexpected',
      }),
    );

    operation.run(undefined);
    operation.cancel();
    await flush();
    expect(operation.state()).toEqual({ status: 'idle' });
  });

  it('turns defects into the caller-provided unexpected failure', async () => {
    const operation = TestBed.runInInjectionContext(() =>
      createEffectOperation({
        execute: () => Effect.die('broken runtime'),
        label: () => 'work',
        presentFailure: String,
        unexpectedFailure: () => 'unexpected',
      }),
    );

    operation.run(undefined);
    await flush();
    expect(operation.failure()).toBe('unexpected');
  });

  it('interrupts in-flight work when its owning view is destroyed', async () => {
    const finalized = vi.fn();

    @Component({ template: '' })
    class HostComponent {
      readonly operation = createEffectOperation({
        execute: () => Effect.never.pipe(Effect.ensuring(Effect.sync(finalized))),
        label: () => 'work',
        presentFailure: String,
        unexpectedFailure: () => 'unexpected',
      });
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.operation.run(undefined);
    await flush();
    fixture.destroy();
    await flush();
    expect(finalized).toHaveBeenCalledOnce();
  });
});
