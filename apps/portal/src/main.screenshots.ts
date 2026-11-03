import { Injectable, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AuthService } from '@app-speed/platform/auth-portal';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/** Local visual-review identity. This entry is never selected by the production build. */
@Injectable()
class CaptureAuthService {
  readonly userId = signal<string | null>(null);
  readonly spaceId = signal<string | null>(null);
  readonly name = signal('Guest');
  readonly organizations = signal([{ id: 'demo_team', name: 'Acme Performance' }]);
  readonly configured = signal(true);
  readonly error = signal('');
  readonly browserCredential =
    localStorage.getItem('audit-browser-credential') ??
    crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  async initialize() {
    if (!['127.0.0.1', 'localhost'].includes(location.hostname)) throw new Error('Capture build is local-only.');
    localStorage.setItem('audit-browser-credential', this.browserCredential);
    const user = localStorage.getItem('capture-user');
    this.userId.set(user);
    this.spaceId.set(user ? (localStorage.getItem('capture-space') ?? `personal:${user}`) : null);
    this.name.set(user === 'user_demo_member' ? 'Sam Rivera' : user ? 'Alex Morgan' : 'Guest');
    document.cookie = `capture-user=${user ?? ''}; Path=/; SameSite=Strict`;
  }
  async headers(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'x-guest-browser': this.browserCredential };
    if (this.userId()) headers['authorization'] = `Bearer ${this.userId()}`;
    if (this.spaceId()) headers['x-audit-space'] = this.spaceId() ?? '';
    return headers;
  }
  async organizationMembers() {
    return [
      { id: 'user_demo_admin', name: 'Alex Morgan' },
      { id: 'user_demo_member', name: 'Sam Rivera' },
    ];
  }
  signIn() {
    localStorage.setItem('capture-user', 'user_demo_admin');
    location.reload();
  }
  signUp() {
    this.signIn();
  }
  async signOut() {
    localStorage.removeItem('capture-user');
    localStorage.removeItem('capture-space');
    document.cookie = 'capture-user=; Path=/; Max-Age=0';
    location.reload();
  }
  async selectSpace(id: string) {
    localStorage.setItem('capture-space', id ? `org:${id}` : `personal:${this.userId()}`);
    location.reload();
  }
  createOrganization() {
    this.error.set('Organization creation is managed by Clerk; a live Clerk instance is required for this dialog.');
  }
  manageOrganization() {
    this.error.set(
      'Membership and invitations are managed by Clerk; a live Clerk instance is required for this dialog.',
    );
  }
}
bootstrapApplication(AppComponent, {
  providers: [...appConfig.providers, { provide: AuthService, useClass: CaptureAuthService }],
}).catch(console.error);
