import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { WorkspaceState } from './workspace-state.service';

const loadPage = () => import('./workspace-page.component').then((module) => module.WorkspacePageComponent);
const loadOnboarding = () =>
  import('./workspace-onboarding.component').then((module) => module.WorkspaceOnboardingComponent);

const openLastWorkspace: CanActivateFn = async () => {
  const state = inject(WorkspaceState);
  const router = inject(Router);
  if (!state.overview()) await state.refresh();
  const workspace = state.workspace();
  return router.createUrlTree(workspace ? state.workspaceLink(workspace.id) : ['/public']);
};

const selectWorkspaceContext: CanActivateFn = async (route) => {
  const state = inject(WorkspaceState);
  const router = inject(Router);
  if (!state.overview()) await state.refresh();
  const workspace = state.overview()?.workspaces.find((item) => item.id === route.paramMap.get('workspaceId'));
  if (!workspace) return router.parseUrl('/workspaces');
  const projectId = route.paramMap.get('projectId');
  if (projectId && !workspace.projects.some((item) => item.id === projectId))
    return router.createUrlTree(['/workspaces', workspace.id]);
  if (projectId && route.data['view'] === 'access' && workspace.role !== 'admin') {
    return router.createUrlTree(['/workspaces', workspace.id, 'projects', projectId]);
  }
  if (state.workspaceId() !== workspace.id) state.selectWorkspace(workspace.id);
  if (projectId) state.selectProject(projectId);
  return true;
};

export const workspaceRoutes: Routes = [
  { path: '', pathMatch: 'full', canActivate: [openLastWorkspace], loadComponent: loadOnboarding },
  { path: 'join', loadComponent: loadOnboarding, title: 'Create or join a workspace | App Speed' },
  {
    path: ':workspaceId/projects/:projectId/settings',
    canActivate: [selectWorkspaceContext],
    loadComponent: loadPage,
    data: { view: 'access' },
    title: 'Project settings | App Speed',
  },
  {
    path: ':workspaceId/projects/:projectId',
    canActivate: [selectWorkspaceContext],
    loadComponent: loadPage,
    data: { view: 'project' },
    title: 'Project | App Speed',
  },
  {
    path: ':workspaceId/settings/members',
    canActivate: [selectWorkspaceContext],
    loadComponent: loadPage,
    data: { view: 'members' },
    title: 'Workspace members | App Speed',
  },
  {
    path: ':workspaceId/settings',
    canActivate: [selectWorkspaceContext],
    loadComponent: loadPage,
    data: { view: 'general' },
    title: 'Workspace settings | App Speed',
  },
  {
    path: ':workspaceId',
    canActivate: [selectWorkspaceContext],
    loadComponent: loadPage,
    data: { view: 'projects' },
    title: 'Projects | App Speed',
  },
];
