import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { type Workspace, workspaceLogoSize } from '@app-speed/workspace/domain';
import { WorkspaceAvatarComponent } from './workspace-avatar.component';
import { WorkspaceState } from './workspace-state.service';

const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileBytes = 5 * 1024 * 1024;

async function prepareLogo(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = workspaceLogoSize;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    const scale = workspaceLogoSize / Math.max(bitmap.width, bitmap.height);
    const width = bitmap.width * scale;
    const height = bitmap.height * scale;
    context.drawImage(bitmap, (workspaceLogoSize - width) / 2, (workspaceLogoSize - height) / 2, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    bitmap.close();
  }
}

@Component({
  selector: 'app-workspace-logo-settings',
  imports: [MatButton, WorkspaceAvatarComponent],
  template: `
    <div class="logo-row">
      <div class="description">
        <app-workspace-avatar [name]="workspace().name" [logo]="workspace().logo" />
        <div>
          <strong>Workspace logo</strong>
          <p>
            {{
              workspace().logo
                ? 'Shown in the workspace switcher.'
                : 'Upload a square image for the workspace switcher.'
            }}
          </p>
        </div>
      </div>
      @if (workspace().role === 'admin') {
        <div class="actions">
          <input #logoFile type="file" hidden accept="image/png,image/jpeg,image/webp" (change)="upload(logoFile)" />
          @if (workspace().logo) {
            <button matButton type="button" [disabled]="busy()" (click)="remove()">Remove logo</button>
          }
          <button matButton="outlined" type="button" [disabled]="busy()" (click)="logoFile.click()">
            {{ workspace().logo ? 'Replace logo' : 'Upload logo' }}
          </button>
        </div>
      }
    </div>
    @if (fileError(); as error) {
      <p class="error" role="alert">{{ error }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
    .logo-row,
    .description,
    .actions {
      display: flex;
      align-items: center;
    }
    .logo-row {
      min-height: 88px;
      box-sizing: border-box;
      padding-block: 16px;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .description {
      gap: 16px;
    }
    app-workspace-avatar {
      --workspace-avatar-size: 56px;
      --workspace-avatar-radius: var(--mat-sys-corner-medium);
      --workspace-avatar-font: var(--mat-sys-headline-small);
    }
    .actions {
      gap: 6px;
      flex-wrap: wrap;
    }
    strong {
      font: var(--mat-sys-title-medium);
    }
    p {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceLogoSettingsComponent {
  readonly workspace = input.required<Workspace>();
  private readonly state = inject(WorkspaceState);
  private readonly preparing = signal(false);
  protected readonly fileError = signal('');
  protected readonly busy = computed(() => this.preparing() || this.state.saving() || this.state.loading());

  protected async upload(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) return;
    this.fileError.set('');
    if (!imageTypes.includes(file.type) || file.size > maxFileBytes) {
      this.fileError.set('Choose a PNG, JPEG, or WebP image up to 5 MB.');
      return;
    }

    const workspaceId = this.workspace().id;
    this.preparing.set(true);
    let logo: string;
    try {
      logo = await prepareLogo(file);
    } catch {
      this.fileError.set('This image could not be opened. Choose another file.');
      return;
    } finally {
      this.preparing.set(false);
    }
    if (workspaceId === this.state.workspaceId())
      await this.state.act({ action: 'setWorkspaceLogo', workspaceId, logo });
  }

  protected remove(): void {
    this.fileError.set('');
    void this.state.act({ action: 'setWorkspaceLogo', workspaceId: this.workspace().id, logo: null });
  }
}
