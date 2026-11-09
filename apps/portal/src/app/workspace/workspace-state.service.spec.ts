import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import type { WorkspaceOverview } from '@app-speed/workspace/domain';
import { PortalAuthService } from '../auth/portal-auth.service';
import { WorkspaceState } from './workspace-state.service';

const snapshot: WorkspaceOverview = {
  account: { id: 'user_chris', name: 'Chris', email: 'chris@example.com', imageUrl: '' },
  workspaces: [
    {
      id: 'holder',
      name: 'Holder',
      logo: null,
      role: 'admin',
      members: [],
      invitations: [],
      projects: [
        { id: 'personal', name: 'Personal site', memberIds: [] },
        { id: 'docs', name: 'Documentation', memberIds: [] },
      ],
    },
    {
      id: 'entain',
      name: 'Entain',
      logo: null,
      role: 'member',
      members: [],
      invitations: [],
      projects: [{ id: 'sportsbook', name: 'Sportsbook', memberIds: ['user_chris'] }],
    },
  ],
  invitations: [],
};

describe('workspace selection and authenticated requests', () => {
  let state: WorkspaceState;
  let http: HttpTestingController;
  const signedIn = signal(true);
  beforeEach(() => {
    localStorage.clear();
    signedIn.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PortalAuthService,
          useValue: { signedIn, sessionToken: vi.fn().mockResolvedValue('verified-session-token') },
        },
      ],
    });
    state = TestBed.inject(WorkspaceState);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });
  const load = async () => {
    const pending = state.refresh();
    await Promise.resolve();
    await Promise.resolve();
    const request = http.expectOne('/api/workspaces');
    expect(request.request.headers.get('Authorization')).toBe('Bearer verified-session-token');
    request.flush(snapshot);
    await pending;
  };

  it('switches workspace and project together without changing the account', async () => {
    await load();
    state.selectWorkspace('holder');
    expect(state.workspace()?.name).toBe('Holder');
    expect(state.project()?.name).toBe('Personal site');
    state.selectWorkspace('entain');
    expect(state.project()?.name).toBe('Sportsbook');
    expect(state.overview()?.account.id).toBe('user_chris');
    state.selectProject('personal');
    expect(state.projectId()).toBe('sportsbook');
    state.selectWorkspace('unrelated-workspace');
    expect(state.workspaceId()).toBe('entain');
  });

  it('remembers a different project for each workspace', async () => {
    await load();
    state.selectWorkspace('holder');
    state.selectProject('docs');
    state.selectWorkspace('entain');
    state.selectProject('sportsbook');
    state.selectWorkspace('holder');
    expect(state.projectId()).toBe('docs');
    expect(state.workspaceLink('holder')).toEqual(['/workspaces', 'holder', 'projects', 'docs']);
    expect(state.workspaceLink('entain')).toEqual(['/workspaces', 'entain', 'projects', 'sportsbook']);
  });

  it('discards stale saved workspace/project IDs and clears data on sign-out', async () => {
    localStorage.setItem(
      'app-speed.context.user_chris',
      JSON.stringify({ workspaceId: 'removed', projectId: 'private' }),
    );
    await load();
    expect(state.workspaceId()).toBe('public');
    expect(state.projectId()).toBe('');
    signedIn.set(false);
    TestBed.tick();
    expect(state.overview()).toBeUndefined();
    expect(state.workspaceId()).toBe('');
    expect(state.projectId()).toBe('');
  });

  it('ignores responses that arrive after sign-out', async () => {
    const pending = state.refresh();
    await Promise.resolve();
    await Promise.resolve();
    const request = http.expectOne('/api/workspaces');
    signedIn.set(false);
    TestBed.tick();
    request.flush(snapshot);
    await pending;
    expect(state.overview()).toBeUndefined();
  });

  it('shows permission failures without pretending the action succeeded', async () => {
    await load();
    const pending = state.act({ action: 'createWorkspace', name: 'Another' });
    await Promise.resolve();
    await Promise.resolve();
    http
      .expectOne('/api/workspaces/actions')
      .flush({ message: 'You do not have access.' }, { status: 403, statusText: 'Forbidden' });
    expect(await pending).toBe(false);
    expect(state.error()).toBe('You do not have access.');
    expect(state.notice()).toBe('');
    expect(state.saving()).toBe(false);
  });

  it('keeps a saved creation pending when its reload fails and blocks duplicate mutations until recovery', async () => {
    await load();
    const action = { action: 'createWorkspace', name: 'Holder' } satisfies Parameters<WorkspaceState['act']>[0];
    const pending = state.act(action);
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('/api/workspaces/actions').flush({ id: 'holder' });
    await vi.waitFor(() => http.expectOne('/api/workspaces').flush({}, { status: 503, statusText: 'Unavailable' }));
    expect(await pending).toBe(false);
    expect(state.refreshRequired()).toBe(true);
    expect(state.error()).toContain('Your changes were saved');
    expect(state.notice()).toBe('');
    expect(await state.act(action)).toBe(false);
    http.expectNone('/api/workspaces/actions');
    await load();
    expect(state.refreshRequired()).toBe(false);
    expect(state.workspaceId()).toBe('holder');
    expect(state.projectId()).toBe('personal');
  });
});
