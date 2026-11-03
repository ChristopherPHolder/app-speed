import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '@app-speed/platform/auth-portal';
import { ManagementOverviewSchema } from '@app-speed/audit/user-flow/api-contract';
import type { UserFlowAuditDefinition } from '@app-speed/audit/user-flow/domain';
const definition: UserFlowAuditDefinition = {
  title: 'Checkout',
  device: 'mobile',
  steps: [
    { type: 'customStep', step: 'startNavigation' },
    { type: 'navigate', url: 'https://example.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
};
import { SavedAuditsComponent } from './saved-audits.component';

const version1 = '00000000-0000-4000-8000-000000000001';
const version2 = '00000000-0000-4000-8000-000000000002';
const scheduleId = '00000000-0000-4000-8000-000000000003';
const templateId = '00000000-0000-4000-8000-000000000004';
const overview: typeof ManagementOverviewSchema.Type = {
  space: { id: 'personal:alice', kind: 'personal', role: 'admin', userId: 'alice' },
  limit: 10,
  templates: [{ id: templateId, title: 'Checkout', createdBy: 'alice' }],
  versions: [version1, version2].map((id) => ({
    id,
    templateId,
    definition,
    createdAt: '2026-11-02T09:00:00Z',
  })),
  schedules: [
    {
      id: scheduleId,
      templateId,
      versionId: version1,
      createdBy: 'alice',
      state: 'active',
      nextDueAt: '2026-11-09T08:00:00Z',
      recurrence: { time: '09:00', timezone: 'Europe/Vienna', weekday: 1, kind: 'weekly' },
    },
  ],
  shares: [],
};

describe('SavedAuditsComponent', () => {
  async function setup(view = overview) {
    await TestBed.configureTestingModule({
      imports: [SavedAuditsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { userId: signal('alice'), configured: signal(true), signIn: vi.fn() },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SavedAuditsComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/audits/user-flow/manage').flush(view);
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    return { fixture, http, root };
  }
  it('repins a version without sending a recurrence edit or resetting cadence', async () => {
    const { fixture, http, root } = await setup();
    const editor = root.querySelector<HTMLElement>('#schedule-editor');
    if (editor) editor.scrollIntoView = vi.fn();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Edit recurrence'))
      ?.click();
    fixture.detectChanges();
    const select = root.querySelector('select');
    expect(select).not.toBeNull();
    if (!select) return;
    select.value = version2;
    select.dispatchEvent(new Event('input'));
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    root.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    const request = http.expectOne('/api/audits/user-flow/manage');
    expect(request.request.body).toEqual({ action: 'updateSchedule', scheduleId, versionId: version2 });
    request.flush({ ok: true });
    await Promise.resolve();
    http.expectOne('/api/audits/user-flow/manage').flush(overview);
    await fixture.whenStable();
    http.verify();
  });
  it('surfaces the configured quota and prevents another active schedule at the limit', async () => {
    const { root, http, fixture } = await setup({ ...overview, limit: 1 });
    expect(root.textContent).toContain('1 / 1 active schedules');
    expect(root.querySelector('form')).toBeNull();
    Array.from(root.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('New schedule'))
      ?.click();
    await fixture.whenStable();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(root.textContent).toContain('Europe/Vienna');
    http.verify();
  });
});
