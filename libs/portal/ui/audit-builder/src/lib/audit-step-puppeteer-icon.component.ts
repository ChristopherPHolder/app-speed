import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-audit-step-puppeteer-icon',
  template: `
    <span class="step-source-icon" title="Puppeteer Replay step" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="9.5" fill="#20b26b" />
        <path
          d="M6.2 11.1c0-2.6 1.2-5 3.1-6.5M17.8 12.9c-.5 2.9-3 5.1-6 5.1-1.6 0-3.1-.6-4.2-1.6"
          fill="none"
          stroke="rgba(255,255,255,0.78)"
          stroke-linecap="round"
          stroke-width="1.35"
        />
        <path d="m10 8.3 5.4 3.7-5.4 3.7z" fill="#ffffff" />
      </svg>
    </span>
  `,
  styles: `
    .step-source-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      border-radius: 999px;
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
      background: linear-gradient(135deg, #e7fff2 0%, #b7f0d4 100%);
    }

    .step-source-icon svg {
      width: 20px;
      height: 20px;
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepPuppeteerIconComponent {}
