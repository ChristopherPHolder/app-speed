import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { IcuMessage } from 'lighthouse/types/lhr/i18n';

type MarkdownSegment =
  | { kind: 'text'; value: string }
  | { kind: 'link'; label: string; href: string };

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)]\(([^)]+)\)/g;

@Component({
  selector: 'ui-viewer-markdown-text',
  template: `
    @for (segment of segments(); track $index) {
      @if (segment.kind === 'link') {
        <a class="markdown-link" [href]="segment.href" target="_blank" rel="noopener">{{ segment.label }}</a>
      } @else {
        <span>{{ segment.value }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: inline;
    }

    .markdown-link {
      color: var(--mat-sys-primary);
      text-decoration: none;
    }

    .markdown-link:hover {
      text-decoration: underline;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewerMarkdownTextComponent {
  text = input.required<string | IcuMessage>();

  readonly segments = computed<MarkdownSegment[]>(() => {
    const value = this.displayText();
    const segments: MarkdownSegment[] = [];
    let lastIndex = 0;

    for (const match of value.matchAll(MARKDOWN_LINK_PATTERN)) {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        segments.push({ kind: 'text', value: value.slice(lastIndex, index) });
      }

      segments.push({
        kind: 'link',
        label: match[1],
        href: match[2],
      });
      lastIndex = index + match[0].length;
    }

    if (!segments.length) {
      return [{ kind: 'text', value }];
    }

    if (lastIndex < value.length) {
      segments.push({ kind: 'text', value: value.slice(lastIndex) });
    }

    return segments;
  });

  private displayText(): string {
    const value = this.text();
    return typeof value === 'string' ? value : value.formattedDefault;
  }
}
