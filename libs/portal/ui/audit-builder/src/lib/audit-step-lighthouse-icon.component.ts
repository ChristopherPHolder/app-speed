import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ui-audit-step-lighthouse-icon',
  template: `
    <span class="step-source-icon" title="Lighthouse step" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M8 21h8l-1.45-6.2h-5.1L8 21Z" fill="#fff6e3" />
        <path d="M12 2.5 16.2 5v6.2H18v2.4h-2.35L18 21H6l2.35-7.4H6v-2.4h1.8V5L12 2.5Z" fill="#f76342" />
        <path d="M10.35 7.4h3.3v4.4h-3.3z" fill="#ffe45c" />
        <path d="M8.35 13.6h7.3" stroke="#ffb39f" stroke-linecap="round" stroke-width="1.2" />
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
      background: linear-gradient(135deg, #fff1eb 0%, #ffe58f 100%);
    }

    .step-source-icon svg {
      width: 20px;
      height: 20px;
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditStepLighthouseIconComponent {}
