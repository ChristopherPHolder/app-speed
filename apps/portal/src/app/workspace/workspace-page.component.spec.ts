import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type { Workspace, WorkspaceOverview } from '@app-speed/workspace/domain';
import { PortalAuthService } from '../auth/portal-auth.service';
import { PublicViewComponent } from './public-view.component';
import { workspaceRoutes } from './workspace.routes';

const account = { id: 'user_chris', email: 'chris@example.com', name: 'Chris', imageUrl: '' };
const holder: Workspace = {
  id: 'holder',
  name: 'Holder',
  logo: null,
  role: 'admin',
  projects: [],
  invitations: [],
  members: [
    { accountId: account.id, email: account.email, name: account.name, role: 'admin' },
    { accountId: 'user_pat', email: 'pat@example.com', name: 'Pat', role: 'member' },
  ],
};
const entain: Workspace = {
  id: 'entain',
  name: 'Entain',
  logo: null,
  role: 'member',
  members: [],
  invitations: [],
  projects: [{ id: 'sportsbook', name: 'Sportsbook', memberIds: [account.id] }],
};
const overview = (workspaces: Workspace[], invitations: WorkspaceOverview['invitations'] = []): WorkspaceOverview => ({
  account,
  workspaces,
  invitations,
});
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const button = (element: ParentNode, label: string) => {
  const match = Array.from(element.querySelectorAll('button')).find((item) => {
    const labelContent = item.cloneNode(true);
    if (!(labelContent instanceof HTMLElement)) return false;
    labelContent.querySelectorAll('mat-icon').forEach((icon) => icon.remove());
    return labelContent.textContent?.trim() === label || item.getAttribute('aria-label') === label;
  });
  if (!match || match.disabled) throw new Error('Button unavailable: ' + label);
  return match;
};
const submit = (element: ParentNode, value: string) => {
  const input = element.querySelector<HTMLInputElement>('input[autocomplete="off"]');
  const form = element.querySelector('form');
  if (!input || !form) throw new Error('Name form missing');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

describe('workspace onboarding and navigation', () => {
  let http: HttpTestingController;
  let router: Router;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'public', component: PublicViewComponent },
            { path: 'workspaces', children: workspaceRoutes },
          ],
          withComponentInputBinding(),
        ),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: PortalAuthService,
          useValue: { signedIn: signal(true), sessionToken: vi.fn().mockResolvedValue('token') },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  async function open(path: string, snapshot: WorkspaceOverview) {
    const pending = RouterTestingHarness.create(path);
    await vi.waitFor(() => http.expectOne('/api/workspaces').flush(snapshot));
    const harness = await pending;
    await settle();
    harness.detectChanges();
    return harness;
  }

  async function finishAction(harness: RouterTestingHarness, result: { id: string }, snapshot: WorkspaceOverview) {
    const request = http.expectOne('/api/workspaces/actions');
    request.flush(result);
    await vi.waitFor(() => http.expectOne('/api/workspaces').flush(snapshot));
    await settle();
    await harness.fixture.whenStable();
    harness.detectChanges();
    return request.request.body;
  }

  it('creates a workspace and opens its same-named initial project from Public View', async () => {
    const harness = await open('/workspaces', overview([]));
    expect(router.url).toBe('/public');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Public View');
    const join = harness.routeNativeElement?.querySelector<HTMLAnchorElement>('a[href="/workspaces/join"]');
    expect(join).toBeTruthy();
    join?.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/workspaces/join');
    const element = harness.routeNativeElement;
    if (!element) throw new Error('Onboarding view missing');
    button(element, 'Create workspace').click();
    harness.detectChanges();
    submit(element, 'Holder');
    await settle();
    const created = { ...holder, projects: [{ id: 'initial', name: 'Holder', memberIds: [] }] };
    expect(await finishAction(harness, { id: 'holder' }, overview([created]))).toEqual({
      action: 'createWorkspace',
      name: 'Holder',
    });
    expect(router.url).toBe('/workspaces/holder/projects/initial');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Holder');
    expect(harness.routeNativeElement?.textContent).not.toContain('Create your first project');
  });

  it('accepts a pending invitation and opens the joined workspace without asking for setup', async () => {
    const harness = await open(
      '/workspaces/join',
      overview([], [{ id: 'invite', workspaceName: 'Entain', role: 'member', expiresAt: '2027-01-01' }]),
    );
    const element = harness.routeNativeElement;
    if (!element) throw new Error('Invitation view missing');
    expect(element.textContent).toContain('Entain');
    button(element, 'Accept').click();
    await settle();
    expect(await finishAction(harness, { id: 'entain' }, overview([entain]))).toEqual({
      action: 'acceptInvitation',
      invitationId: 'invite',
    });
    expect(router.url).toBe('/workspaces/entain');
    expect(harness.routeNativeElement?.textContent).toContain('Sportsbook');
    expect(harness.routeNativeElement?.textContent).not.toContain('Create project');
  });

  it('reloads a saved workspace after a transient failure without submitting a duplicate creation', async () => {
    const harness = await open('/workspaces/join', overview([]));
    const element = harness.routeNativeElement;
    if (!element) throw new Error('Onboarding view missing');
    button(element, 'Create workspace').click();
    harness.detectChanges();
    submit(element, 'Holder');
    await settle();
    http.expectOne('/api/workspaces/actions').flush({ id: 'holder' });
    await vi.waitFor(() => http.expectOne('/api/workspaces').flush({}, { status: 503, statusText: 'Unavailable' }));
    await settle();
    harness.detectChanges();
    expect(router.url).toBe('/workspaces/join');
    expect(element.textContent).toContain('Your changes were saved');
    expect(element.querySelector('form')).toBeNull();
    button(element, 'Try again').click();
    const created = { ...holder, projects: [{ id: 'initial', name: 'Holder', memberIds: [] }] };
    await vi.waitFor(() => http.expectOne('/api/workspaces').flush(overview([created])));
    await harness.fixture.whenStable();
    http.expectNone('/api/workspaces/actions');
    await vi.waitFor(() => expect(router.url).toBe('/workspaces/holder/projects/initial'));
  });

  it('restores the last project and blocks direct access to another workspace or its settings', async () => {
    localStorage.setItem(
      'app-speed.context.user_chris',
      JSON.stringify({ workspaceId: 'entain', projectId: 'sportsbook', projects: { entain: 'sportsbook' } }),
    );
    const harness = await open('/workspaces', overview([holder, entain]));
    expect(router.url).toBe('/workspaces/entain/projects/sportsbook');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Sportsbook');
    await harness.navigateByUrl('/workspaces/entain/projects/sportsbook/settings');
    expect(router.url).toBe('/workspaces/entain/projects/sportsbook');
    await harness.navigateByUrl('/workspaces/not-a-member');
    expect(router.url).toBe('/workspaces/entain/projects/sportsbook');
    await harness.navigateByUrl('/public');
    await harness.navigateByUrl('/workspaces');
    expect(router.url).toBe('/public');
  });

  it('creates a project in a Material dialog and opens the new project', async () => {
    const harness = await open('/workspaces/holder', overview([holder]));
    const element = harness.routeNativeElement;
    if (!element) throw new Error('Projects view missing');
    button(element, 'Create project').click();
    harness.detectChanges();
    await settle();
    const dialog = document.querySelector('mat-dialog-container');
    if (!dialog) throw new Error('Project dialog missing');
    submit(dialog, 'Personal site');
    await settle();
    const withProject = { ...holder, projects: [{ id: 'personal', name: 'Personal site', memberIds: [] }] };
    expect(await finishAction(harness, { id: 'personal' }, overview([withProject]))).toEqual({
      action: 'createProject',
      workspaceId: 'holder',
      name: 'Personal site',
    });
    await vi.waitFor(() => expect(router.url).toBe('/workspaces/holder/projects/personal'));
  });

  it('keeps access grants in project settings and member controls in workspace settings', async () => {
    const project = { id: 'personal', name: 'Personal site', memberIds: [] };
    const workspace = { ...holder, projects: [project] };
    const harness = await open('/workspaces/holder/projects/personal', overview([workspace]));
    expect(harness.routeNativeElement?.textContent).not.toContain('Grant access');
    await harness.navigateByUrl('/workspaces/holder/projects/personal/settings');
    const settings = harness.routeNativeElement;
    if (!settings) throw new Error('Settings view missing');
    button(settings, 'Grant project access to Pat').click();
    await settle();
    expect(
      await finishAction(
        harness,
        { id: 'holder' },
        overview([{ ...workspace, projects: [{ ...project, memberIds: ['user_pat'] }] }]),
      ),
    ).toEqual({ action: 'grantProjectAccess', workspaceId: 'holder', projectId: 'personal', accountId: 'user_pat' });
    expect(settings.querySelector('[aria-label="Remove project access for Pat"]')).not.toBeNull();
    await harness.navigateByUrl('/workspaces/holder/settings/members');
    expect(
      harness.routeNativeElement?.querySelector('mat-list[aria-label="Workspace members"]')?.textContent,
    ).toContain('Pat');
    expect(harness.routeNativeElement?.textContent).not.toContain('Delete workspace');
  });
});
