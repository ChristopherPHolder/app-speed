import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Prints the value a token currently resolves to, so the docs never drift from the theme.
 * Colours are resolved through a real property because `light-dark()` only computes there.
 */
@Component({
  selector: 'ui-docs-token-value',
  template: `{{ value() }}`,
  styles: `
    :host {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenValueComponent {
  readonly token = input.required<string>();
  readonly kind = input<'raw' | 'color'>('raw');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly value = signal('');

  constructor() {
    afterRenderEffect(() => {
      const token = this.token();
      if (this.kind() === 'raw') {
        this.value.set(getComputedStyle(this.host).getPropertyValue(token).trim());
        return;
      }
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      this.host.appendChild(probe);
      this.value.set(toHex(getComputedStyle(probe).color));
      probe.remove();
    });
  }
}

function toHex(color: string): string {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) return color;
  const [red, green, blue, alpha] = channels;
  const hex = [red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('');
  return alpha === undefined || alpha === 1 ? `#${hex}` : `#${hex} / ${Math.round(alpha * 100)}%`;
}
