import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Schema } from 'effect';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@app-speed/platform/auth-portal';
import { UserFlowAuditDefinitionSchema } from '@app-speed/audit/user-flow/domain';
import type { AuditManagementCommand } from '@app-speed/audit/user-flow/api-contract';

@Component({
  selector: 'audit-ownership',
  imports: [RouterLink, MatAnchor, MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section aria-label="Save and share audit" class="ownership-card">
    <div class="ownership-row">
      <span class="ownership-icon"
        ><mat-icon>{{
          auth.userId() ? (runId() && claimToken() ? 'move_to_inbox' : 'bookmark_border') : 'lock_outline'
        }}</mat-icon></span
      >
      <div class="ownership-copy">
        <h2>
          {{
            auth.userId()
              ? runId() && claimToken()
                ? 'Give this audit a home'
                : 'Keep this journey'
              : 'Make this check a habit'
          }}
        </h2>
        <p>
          {{
            auth.userId()
              ? runId() && claimToken()
                ? 'Claim it into your active space. Its original URL will become private.'
                : 'Save a snapshot to run again or add to a recurring schedule.'
              : 'Sign in to save, claim, share, or schedule this audit.'
          }}
        </p>
      </div>
      <div class="ownership-actions">
        @if (auth.userId()) {
          @if (runId() && claimToken()) {
            <button mat-flat-button type="button" [disabled]="busy()" (click)="claim()">
              <mat-icon>bookmark_add</mat-icon>Claim into active space
            </button>
          } @else {
            @if (definition()) {
              <button mat-flat-button type="button" [disabled]="busy()" (click)="save()">
                <mat-icon>save</mat-icon>Save immutable version
              </button>
            }
            @if (runId()) {
              <button mat-stroked-button type="button" [disabled]="busy()" (click)="share()">
                <mat-icon>link</mat-icon>Create public result link
              </button>
            }
          }
          <a mat-button routerLink="/audits/saved">Saved audits & schedules<mat-icon>arrow_forward</mat-icon></a>
        } @else {
          <button mat-stroked-button type="button" [disabled]="!auth.configured()" (click)="auth.signIn()">
            Sign in<mat-icon>arrow_forward</mat-icon>
          </button>
        }
      </div>
    </div>
    @if (message()) {
      <p class="ownership-message" role="status"><mat-icon>info_outline</mat-icon>{{ message() }}</p>
    }
    @if (shareUrl()) {
      <div class="share-result">
        <div>
          <span class="share-label"><mat-icon>public</mat-icon>Public result link</span>
          <p>Anyone with this link can view this result. Revoke access from saved audits.</p>
        </div>
        <div class="share-field">
          <input aria-label="Copy public result URL" readonly [value]="shareUrl()" /><button
            mat-button
            type="button"
            (click)="copyLink()"
          >
            <mat-icon>content_copy</mat-icon>Copy</button
          ><a mat-button [href]="shareUrl()" target="_blank" rel="noopener noreferrer"
            >Open<mat-icon>open_in_new</mat-icon></a
          >
        </div>
      </div>
    }
  </section>`,
  styles: `
    :host {
      display: block;
      margin: 24px auto;
      width: min(100% - 48px, 1120px);
    }
    .ownership-card {
      padding: 22px 24px;
      border: 1px solid #dce6f4;
      border-radius: 14px;
      background: #f8fbff;
      color: #294565;
    }
    .ownership-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .ownership-icon {
      display: grid;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      place-items: center;
      border-radius: 11px;
      background: #e7f0ff;
      color: #3474cf;
    }
    .ownership-copy {
      flex: 1;
      min-width: 0;
    }
    h2 {
      margin: 0 0 5px;
      font-size: 14px;
      font-weight: 600;
    }
    .ownership-copy p {
      margin: 0;
      color: #65758b;
      font-size: 12px;
      line-height: 1.6;
    }
    .ownership-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      max-width: 60%;
    }
    .ownership-message {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding-top: 16px;
      margin: 16px 0 0;
      border-top: 1px solid #e0e9f5;
      font-size: 12px;
      line-height: 1.6;
      color: #438276;
    }
    .ownership-message mat-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
    .share-result {
      display: grid;
      gap: 14px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e9f5;
    }
    .share-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .share-label mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .share-result p {
      margin: 6px 0 0;
      color: #65758b;
      font-size: 11px;
      line-height: 1.6;
    }
    .share-field {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    input {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 12px;
      border: 1px solid #d6e2f2;
      border-radius: 8px;
      background: #fff;
      color: #6480a3;
      font: 11px/1.5 monospace;
    }
    @media (max-width: 960px) {
      .ownership-row {
        flex-wrap: wrap;
      }
      .ownership-actions {
        justify-content: flex-start;
        max-width: 100%;
        margin-left: 54px;
      }
    }
    @media (max-width: 600px) {
      :host {
        width: calc(100% - 32px);
      }
      .ownership-card {
        padding: 18px;
      }
      .ownership-row {
        gap: 12px;
        align-items: flex-start;
      }
      .ownership-icon {
        width: 32px;
        height: 32px;
      }
      .ownership-icon mat-icon {
        width: 20px;
        height: 20px;
        font-size: 20px;
      }
      .ownership-copy {
        flex-basis: calc(100% - 44px);
      }
      .ownership-actions {
        margin: 4px 0 0;
        gap: 8px;
        width: 100%;
      }
      .ownership-actions > button,
      .ownership-actions > a {
        width: 100%;
      }
      .share-field {
        flex-wrap: wrap;
      }
      .share-field input {
        flex-basis: 100%;
      }
      .share-field > button {
        margin-left: auto;
      }
    }
  `,
})
export class AuditOwnershipComponent {
  readonly definition = input<unknown>();
  readonly runId = input('');
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly shareUrl = signal('');
  protected claimToken() {
    return localStorage.getItem(`audit-claim:${this.runId()}`);
  }
  private command(command: AuditManagementCommand) {
    return firstValueFrom(this.http.post<unknown>('/api/audits/user-flow/manage', command));
  }
  private async perform(action: () => Promise<void>) {
    this.busy.set(true);
    this.message.set('');
    try {
      await action();
    } catch {
      this.message.set('Unable to save. Check that this audit belongs to your active space and you have permission.');
    } finally {
      this.busy.set(false);
    }
  }
  protected async copyLink() {
    try {
      await navigator.clipboard.writeText(this.shareUrl());
      this.message.set('Public result link copied.');
    } catch {
      this.message.set('Select and copy the public result URL above.');
    }
  }
  protected claim() {
    return this.perform(async () => {
      await this.command({ action: 'claim', runId: this.runId(), claimToken: this.claimToken() ?? '' });
      localStorage.removeItem(`audit-claim:${this.runId()}`);
      this.message.set('Claimed into the active space. The original URL is now private.');
    });
  }
  protected save() {
    return this.perform(async () => {
      const definition = Schema.decodeUnknownSync(UserFlowAuditDefinitionSchema)(this.definition());
      const templateId = this.route.snapshot.queryParamMap.get('templateId');
      await this.command({ action: 'save', ...(templateId ? { templateId } : {}), definition });
      this.message.set('Version saved in the active space. Open saved audits to schedule it.');
    });
  }
  protected share() {
    return this.perform(async () => {
      const response = Schema.decodeUnknownSync(Schema.Struct({ shareToken: Schema.String }))(
        await this.command({ action: 'share', runId: this.runId() }),
      );
      this.shareUrl.set(
        `${window.location.origin}/audits/shared/${this.runId()}?share=${encodeURIComponent(response.shareToken)}`,
      );
    });
  }
}
