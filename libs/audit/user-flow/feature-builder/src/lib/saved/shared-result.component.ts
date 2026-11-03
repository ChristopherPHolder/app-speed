import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, EMPTY, switchMap } from 'rxjs';
import { Schema } from 'effect';
import { AuditViewerContainer } from '@app-speed/audit/user-flow/feature-viewer';

@Component({
  selector: 'audit-shared-result',
  imports: [AuditViewerContainer, MatIcon, MatAnchor, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section>
    <header>
      <div class="shared-eyebrow"><mat-icon>link</mat-icon>Shared report<span>Read only</span></div>
      <h1>Shared audit result</h1>
      <p>A snapshot of one journey. This link grants read-only access to one run.</p>
    </header>
    @if (error()) {
      <div class="unavailable">
        <span class="unavailable-icon"><mat-icon>link_off</mat-icon></span>
        <h2>This report is unavailable.</h2>
        <p role="alert">{{ error() }}</p>
        <a mat-stroked-button routerLink="/audits/user-flow">Run your own audit<mat-icon>arrow_forward</mat-icon></a>
      </div>
    }
    @if (shareToken(); as token) {
      <viewer-container [auditId]="id()" [shareToken]="token" />
    }
  </section>`,
  styles: `
    :host {
      display: block;
      color: #203854;
    }
    section {
      width: min(100% - 48px, 1120px);
      margin: 36px auto 56px;
    }
    header {
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid #e5ebf3;
    }
    .shared-eyebrow {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6080a7;
      font-size: 10px;
      font-weight: 650;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .shared-eyebrow mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .shared-eyebrow > span {
      margin-left: auto;
      padding: 6px 9px;
      border: 1px solid #e0e8f3;
      border-radius: 6px;
      font-size: 9px;
      color: #65758b;
      letter-spacing: 0.4px;
    }
    h1 {
      font-size: 30px;
      letter-spacing: -0.8px;
      margin: 14px 0 10px;
      line-height: 1.2;
    }
    header > p {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
      color: #65758b;
    }
    .unavailable {
      display: grid;
      justify-items: center;
      padding: 56px 24px;
      border: 1px solid #e1e8f2;
      border-radius: 18px;
      background: #f8fafd;
      text-align: center;
    }
    .unavailable-icon {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-bottom: 20px;
      border-radius: 16px;
      background: #eaf0f9;
      color: #7a96bc;
    }
    h2 {
      margin: 0;
      font-size: 20px;
      letter-spacing: -0.4px;
    }
    .unavailable p {
      max-width: 420px;
      color: #65758b;
      font-size: 13px;
      line-height: 1.8;
      margin: 14px 0 24px;
    }
    @media (max-width: 600px) {
      section {
        width: calc(100% - 32px);
        margin-top: 28px;
      }
      h1 {
        font-size: 27px;
      }
      header > p {
        font-size: 12px;
      }
      .unavailable {
        padding: 36px 20px;
      }
    }
  `,
})
export class SharedResultComponent {
  readonly id = input.required<string>();
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  protected readonly error = signal('');
  protected readonly shareToken = signal('');
  constructor() {
    combineLatest([toObservable(this.id), this.route.queryParamMap])
      .pipe(
        switchMap(([id, query]) => {
          this.shareToken.set('');
          this.error.set('');
          const base = `/api/audits/user-flow/${encodeURIComponent(id)}`;
          const params = { share: query.get('share') ?? '' };
          return this.http.get<unknown>(`${base}/result`, { params }).pipe(
            switchMap((value) => {
              const result = Schema.decodeUnknownSync(
                Schema.Struct({
                  status: Schema.Literals(['SUCCESS', 'FAILURE']),
                  error: Schema.optional(Schema.Struct({ message: Schema.String })),
                }),
              )(value);
              if (result.status === 'FAILURE') {
                this.error.set(result.error?.message ?? 'This audit failed.');
                return EMPTY;
              }
              this.shareToken.set(params.share);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        error: () =>
          this.error.set(
            'This report is unavailable. The link may have been revoked, or the run has no successful report.',
          ),
      });
  }
}
