import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Schema } from 'effect';
import { WorkspaceOverviewSchema, type WorkspaceAction, type WorkspaceOverview } from '@app-speed/workspace/domain';
import { PortalAuthService } from '../auth/portal-auth.service';

export const publicViewId = 'public';

@Injectable({ providedIn: 'root' })
export class WorkspaceState {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(PortalAuthService);
  readonly overview = signal<WorkspaceOverview | undefined>(undefined);
  readonly workspaceId = signal('');
  readonly projectId = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly workspace = computed(() => this.overview()?.workspaces.find((item) => item.id === this.workspaceId()));
  readonly project = computed(() => this.workspace()?.projects.find((item) => item.id === this.projectId()));
  private readonly recentProjects = signal<Readonly<Record<string, string>>>({});
  private generation = 0;
  private pending: Promise<void> | undefined;

  constructor() {
    effect(() => {
      if (!this.auth.signedIn()) {
        this.generation++;
        this.overview.set(undefined);
        this.workspaceId.set('');
        this.projectId.set('');
        this.recentProjects.set({});
        this.error.set('');
        this.notice.set('');
      }
    });
  }

  refresh(): Promise<void> {
    if (this.pending) return this.pending;
    this.pending = this.load().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  private async load(): Promise<void> {
    const generation = this.generation;
    this.loading.set(true);
    this.error.set('');
    try {
      const headers = await this.headers();
      const response = await firstValueFrom(this.http.get<unknown>('/api/workspaces', { headers }));
      const overview = await Schema.decodeUnknownPromise(WorkspaceOverviewSchema)(response);
      if (generation !== this.generation) return;
      const preference = this.readPreference(overview.account.id);
      if (this.overview()?.account.id !== overview.account.id) {
        this.recentProjects.set(
          preference.projects ??
            (preference.workspaceId && preference.projectId ? { [preference.workspaceId]: preference.projectId } : {}),
        );
      }
      this.overview.set(overview);
      const workspaceId = this.workspaceId() || preference.workspaceId;
      const workspace = overview.workspaces.find((item) => item.id === workspaceId);
      this.workspaceId.set(workspace?.id ?? publicViewId);
      const projectId = this.projectId() || this.recentProjects()[workspace?.id ?? ''];
      this.projectId.set(
        workspace?.projects.find((item) => item.id === projectId)?.id ?? workspace?.projects[0]?.id ?? '',
      );
      this.savePreference();
    } catch (error) {
      if (generation === this.generation) this.error.set(this.message(error));
    } finally {
      this.loading.set(false);
    }
  }

  selectPublicView(): void {
    this.workspaceId.set(publicViewId);
    this.projectId.set('');
    this.notice.set('');
    this.savePreference();
  }

  selectWorkspace(id: string): void {
    const workspace = this.overview()?.workspaces.find((item) => item.id === id);
    if (!workspace) return;
    this.workspaceId.set(id);
    this.projectId.set(
      workspace.projects.find((item) => item.id === this.recentProjects()[id])?.id ?? workspace.projects[0]?.id ?? '',
    );
    this.notice.set('');
    this.savePreference();
  }

  selectProject(id: string): void {
    if (!this.workspace()?.projects.some((item) => item.id === id)) return;
    this.projectId.set(id);
    this.recentProjects.update((projects) => ({ ...projects, [this.workspaceId()]: id }));
    this.savePreference();
  }

  workspaceLink(id: string): ReadonlyArray<string> {
    const workspace = this.overview()?.workspaces.find((item) => item.id === id);
    const recent = workspace?.projects.find((project) => project.id === this.recentProjects()[id]);
    return recent ? ['/workspaces', id, 'projects', recent.id] : ['/workspaces', id];
  }

  async act(action: WorkspaceAction): Promise<boolean> {
    if (this.saving() || this.loading()) return false;
    const generation = this.generation;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      const headers = await this.headers();
      const response = await firstValueFrom(this.http.post<unknown>('/api/workspaces/actions', action, { headers }));
      const result = await Schema.decodeUnknownPromise(Schema.Struct({ id: Schema.String }))(response);
      if (generation !== this.generation) return false;
      if (action.action === 'createWorkspace' || action.action === 'acceptInvitation') {
        this.workspaceId.set(result.id);
        this.projectId.set('');
      }
      if (action.action === 'createProject') this.projectId.set(result.id);
      await this.refresh();
      if (generation !== this.generation) return false;
      this.notice.set(
        action.action === 'inviteMember'
          ? 'Invitation created. They can accept it from Workspaces when they sign in with that email address.'
          : 'Changes saved.',
      );
      return true;
    } catch (error) {
      if (generation === this.generation) this.error.set(this.message(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  private async headers(): Promise<HttpHeaders> {
    const token = await this.auth.sessionToken();
    if (!token) throw new Error('Sign in again to manage workspaces.');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body: unknown = error.error;
      const decoded = Schema.decodeUnknownExit(Schema.Struct({ message: Schema.String }))(body);
      if (decoded._tag === 'Success') return decoded.value.message;
      return 'Workspace management could not be reached. Please try again.';
    }
    return error instanceof Error && error.message === 'Sign in again to manage workspaces.'
      ? error.message
      : 'Workspace data could not be loaded. Please try again.';
  }

  private readPreference(accountId: string): {
    workspaceId: string;
    projectId: string;
    projects?: Readonly<Record<string, string>>;
  } {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`app-speed.context.${accountId}`) ?? '{}');
      const decoded = Schema.decodeUnknownExit(
        Schema.Struct({
          workspaceId: Schema.String,
          projectId: Schema.String,
          projects: Schema.optional(Schema.Record(Schema.String, Schema.String)),
        }),
      )(value);
      if (decoded._tag === 'Success') return decoded.value;
    } catch {
      /* Storage is optional. */
    }
    return { workspaceId: '', projectId: '' };
  }

  private savePreference(): void {
    const account = this.overview()?.account;
    if (!account) return;
    try {
      localStorage.setItem(
        `app-speed.context.${account.id}`,
        JSON.stringify({
          workspaceId: this.workspaceId(),
          projectId: this.projectId(),
          projects: this.recentProjects(),
        }),
      );
    } catch {
      /* Switching works when browser storage is unavailable. */
    }
  }
}
