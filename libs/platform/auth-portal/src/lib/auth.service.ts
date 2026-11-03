import { Injectable, signal } from '@angular/core';
import type { Clerk } from '@clerk/clerk-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private clerk: Clerk | null = null;
  private initialization: Promise<void> | null = null;
  readonly userId = signal<string | null>(null);
  readonly spaceId = signal<string | null>(null);
  readonly name = signal('Guest');
  readonly organizations = signal<ReadonlyArray<{ id: string; name: string }>>([]);
  readonly configured = signal(false);
  readonly error = signal('');
  readonly browserCredential = this.guestCredential();

  private guestCredential() {
    let credential = localStorage.getItem('audit-browser-credential');
    if (!credential) {
      credential = Array.from(crypto.getRandomValues(new Uint8Array(32)), (v) => v.toString(16).padStart(2, '0')).join(
        '',
      );
      localStorage.setItem('audit-browser-credential', credential);
    }
    return credential;
  }

  initialize(): Promise<void> {
    return (this.initialization ??= this.load());
  }
  private async load() {
    try {
      const response = await fetch('/api/auth/config', { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error('Authentication configuration is unavailable.');
      const config: unknown = await response.json();
      if (
        !config ||
        typeof config !== 'object' ||
        !('publishableKey' in config) ||
        typeof config.publishableKey !== 'string'
      )
        throw new Error('Invalid authentication configuration.');
      if (!config.publishableKey) return;
      const { Clerk } = await import('@clerk/clerk-js');
      const clerk = new Clerk(config.publishableKey);
      await clerk.load();
      this.clerk = clerk;
      this.configured.set(true);
      clerk.addListener(({ user, organization }) => {
        this.userId.set(user?.id ?? null);
        this.spaceId.set(organization ? `org:${organization.id}` : user ? `personal:${user.id}` : null);
        this.name.set(user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Guest');
      });
      if (clerk.user) {
        const memberships = await clerk.user.getOrganizationMemberships({ pageSize: 100 });
        this.organizations.set(memberships.data.map((m) => ({ id: m.organization.id, name: m.organization.name })));
      }
    } catch {
      this.error.set('Sign-in is unavailable. Guest audits are still available.');
    }
  }
  async headers(): Promise<Record<string, string>> {
    await this.initialize();
    const headers: Record<string, string> = { 'x-guest-browser': this.browserCredential };
    if (this.spaceId()) headers['x-audit-space'] = this.spaceId() ?? '';
    if (this.clerk?.session) {
      const token = await this.clerk.session.getToken();
      if (token) headers['authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
  async organizationMembers(): Promise<ReadonlyArray<{ id: string; name: string }>> {
    const organization = this.clerk?.organization;
    if (!organization) return [];
    const members: { id: string; name: string }[] = [];
    for (let page = 1; ; page++) {
      const response = await organization.getMemberships({ pageSize: 100, initialPage: page });
      for (const membership of response.data) {
        const user = membership.publicUserData;
        if (user?.userId) {
          members.push({
            id: user.userId,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.identifier,
          });
        }
      }
      if (response.data.length < 100) return members;
    }
  }
  signIn() {
    this.clerk?.openSignIn({ forceRedirectUrl: window.location.href });
  }
  signUp() {
    this.clerk?.openSignUp({ forceRedirectUrl: window.location.href });
  }
  async signOut() {
    await this.clerk?.signOut();
    window.location.reload();
  }
  async selectSpace(organizationId: string) {
    await this.clerk?.setActive({ organization: organizationId || null });
    window.location.reload();
  }
  createOrganization() {
    this.clerk?.openCreateOrganization({ afterCreateOrganizationUrl: window.location.href });
  }
  manageOrganization() {
    this.clerk?.openOrganizationProfile();
  }
}
