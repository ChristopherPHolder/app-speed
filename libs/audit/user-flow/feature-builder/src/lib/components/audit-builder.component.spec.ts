import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconRegistry } from '@angular/material/icon';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DEFAULT_AUDIT_DETAILS } from '../audit-details';
import { AuditBuilderComponent } from './audit-builder.component';

describe('AuditBuilderComponent', () => {
  let fixture: ComponentFixture<AuditBuilderComponent>;

  const renderBuilder = async ({
    modifying,
    primaryAction,
    submittingRequest = false,
  }: {
    modifying: boolean;
    primaryAction: 'analyze' | 'fork' | 'none';
    submittingRequest?: boolean;
  }) => {
    await TestBed.configureTestingModule({
      imports: [AuditBuilderComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: MatIconRegistry,
          useValue: {
            getNamedSvgIcon: () => of(document.createElementNS('http://www.w3.org/2000/svg', 'svg')),
            getDefaultFontSetClass: () => ['material-icons'],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditBuilderComponent);
    fixture.componentRef.setInput('initialAudit', { ...DEFAULT_AUDIT_DETAILS, title: 'Checkout audit' });
    fixture.componentRef.setInput('modifying', modifying);
    fixture.componentRef.setInput('primaryAction', primaryAction);
    fixture.componentRef.setInput('submittingRequest', submittingRequest);
    fixture.detectChanges();
    await fixture.whenStable();

    return fixture;
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('adds and removes steps through the restored menu and updates numbering', async () => {
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    const host: HTMLElement = builderFixture.nativeElement;
    const steps = builderFixture.componentInstance.formGroup.controls.steps;
    const firstStep = steps.at(0);
    const navigateStep = steps.at(1);

    const menuAction = async (index: number, label: string) => {
      host.querySelectorAll<HTMLButtonElement>('[aria-label^="Actions for step"]')[index].click();
      builderFixture.detectChanges();
      await builderFixture.whenStable();
      const panels = document.querySelectorAll('.mat-mdc-menu-panel');
      const panel = panels.item(panels.length - 1);
      const item = Array.from(panel.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')).find(
        (button) => button.textContent?.trim() === label,
      );
      if (!item) throw new Error(`Missing menu action: ${label}`);
      item.click();
      builderFixture.componentRef.changeDetectorRef.markForCheck();
      builderFixture.detectChanges();
      await builderFixture.whenStable();
    };

    await menuAction(0, 'Add step after');
    expect(steps.length).toBe(4);
    expect(steps.at(1).selectionControl.value).toBe('');
    expect(steps.at(2)).toBe(navigateStep);

    await menuAction(0, 'Add step before');
    expect(steps.length).toBe(5);
    expect(steps.at(0).selectionControl.value).toBe('');
    expect(steps.at(1)).toBe(firstStep);

    await menuAction(0, 'Remove step');
    expect(steps.length).toBe(4);
    expect(steps.at(0)).toBe(firstStep);
    expect(Array.from(host.querySelectorAll('.step-number'), (element) => element.textContent?.trim())).toEqual([
      'Step 1',
      'Step 2',
      'Step 3',
      'Step 4',
    ]);
    expect(host.querySelector('.insert-step, .add-step, .remove-step')).toBeNull();
  });

  it('adds a step at the end, and still offers to add one after every step is removed', async () => {
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    const host: HTMLElement = builderFixture.nativeElement;
    const steps = builderFixture.componentInstance.formGroup.controls.steps;
    const addStep = async () => {
      const button = host.querySelector<HTMLButtonElement>('.steps__add');
      if (!button) throw new Error('Missing Add step button');
      button.click();
      builderFixture.detectChanges();
      await builderFixture.whenStable();
    };

    await addStep();
    expect(steps.length).toBe(4);
    expect(steps.at(3).selectionControl.value).toBe('');
    expect(host.querySelectorAll('ui-audit-builder-step')).toHaveLength(4);
    expect(document.activeElement).toBe(host.querySelectorAll('ui-audit-builder-step')[3].querySelector('mat-select'));

    while (steps.length > 0) builderFixture.componentInstance.formGroup.removeStepAt(0);
    builderFixture.componentRef.changeDetectorRef.markForCheck();
    builderFixture.detectChanges();
    expect(host.querySelector('ui-empty-state')?.textContent).toContain('No steps yet');
    expect(host.querySelector('.action-bar')?.textContent).toContain('0 steps');

    await addStep();
    expect(steps.length).toBe(1);
    expect(host.querySelector('ui-empty-state')).toBeNull();
  });

  it('hides step menus in read-only mode', async () => {
    const builderFixture = await renderBuilder({ modifying: false, primaryAction: 'fork' });
    const host: HTMLElement = builderFixture.nativeElement;
    expect(host.querySelector('[aria-label^="Actions for step"]')).toBeNull();
    expect(host.querySelector('.steps__add')).toBeNull();
    expect(host.querySelectorAll('.step-number')).toHaveLength(3);
  });

  it('does not emit a submit when the primary action is Fork', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: false, primaryAction: 'fork' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);

    submitForm(builderFixture);

    expect(submitAudit).not.toHaveBeenCalled();
  });

  it('emits a fork request from the read-only Fork action', async () => {
    const forked = vi.fn();
    const builderFixture = await renderBuilder({ modifying: false, primaryAction: 'fork' });
    builderFixture.componentInstance.forked.subscribe(forked);

    const forkButton = builderFixture.nativeElement.querySelector('button.submit-btn');
    expect(forkButton).toBeInstanceOf(HTMLButtonElement);
    if (!(forkButton instanceof HTMLButtonElement)) return;
    forkButton.click();
    await builderFixture.whenStable();

    expect(forked).toHaveBeenCalledOnce();
  });

  it('does not emit a submit while an audit request is already in flight', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({
      modifying: true,
      primaryAction: 'analyze',
      submittingRequest: true,
    });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);

    submitForm(builderFixture);

    expect(submitAudit).not.toHaveBeenCalled();
  });

  it('emits the configured audit when the valid Run audit form is submitted', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);

    const urlInput = builderFixture.nativeElement.querySelectorAll('ui-audit-builder-step')[1]?.querySelector('input');
    expect(urlInput).toBeInstanceOf(HTMLInputElement);
    if (!(urlInput instanceof HTMLInputElement)) return;
    urlInput.value = 'https://example.com';
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
    await builderFixture.whenStable();

    submitForm(builderFixture);

    expect(submitAudit).toHaveBeenCalledWith({
      ...DEFAULT_AUDIT_DETAILS,
      title: 'Checkout audit',
      steps: [
        DEFAULT_AUDIT_DETAILS.steps[0],
        { type: 'navigate', url: 'https://example.com' },
        DEFAULT_AUDIT_DETAILS.steps[2],
      ],
    });
  });

  it('keeps Run audit enabled and shows what blocks the run once it is tried', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);
    const host: HTMLElement = builderFixture.nativeElement;
    const form = builderFixture.componentInstance.formGroup;
    const actionText = () => host.querySelector('.action-bar')?.textContent;
    const steps = () => Array.from(host.querySelectorAll<HTMLElement>('ui-audit-builder-step'));
    const flagged = () => steps().map((step) => step.querySelector('.step-error') !== null);

    // The default audit has no URL yet. Nothing is flagged before a run is tried.
    expect(actionText()).toContain('3 steps');
    expect(host.querySelector('.action-bar__problem')?.textContent?.trim()).toBe('');
    expect(host.querySelector<HTMLButtonElement>('.submit-btn')?.disabled).toBe(false);
    expect(flagged()).toEqual([false, false, false]);

    submitForm(builderFixture);
    await builderFixture.whenStable();
    builderFixture.detectChanges();

    expect(submitAudit).not.toHaveBeenCalled();
    expect(actionText()).toContain('Fix the highlighted fields');
    expect(flagged()).toEqual([false, true, false]);
    expect(steps()[1].querySelector('.step-error')?.getAttribute('aria-label')).toBe('Has errors');
    expect(document.activeElement).toBe(steps()[1].querySelector('input'));
    expect(steps()[1].querySelector('mat-error')?.textContent?.trim()).toBe('Enter a value.');

    form.controls.steps.at(1).get('url')?.setValue('https://example.com');
    builderFixture.componentRef.changeDetectorRef.markForCheck();
    builderFixture.detectChanges();
    expect(flagged()).toEqual([false, false, false]);
    expect(host.querySelector('.action-bar__problem')?.textContent?.trim()).toBe('');

    submitForm(builderFixture);
    expect(submitAudit).toHaveBeenCalledOnce();
  });

  it('opens a collapsed step that has something to fix', async () => {
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    const host: HTMLElement = builderFixture.nativeElement;
    const panel = () => host.querySelectorAll('ui-audit-builder-step mat-expansion-panel')[1];

    host.querySelectorAll<HTMLElement>('mat-expansion-panel-header')[1].click();
    builderFixture.detectChanges();
    await builderFixture.whenStable();
    expect(panel().classList).not.toContain('mat-expanded');

    submitForm(builderFixture);
    await builderFixture.whenStable();
    builderFixture.detectChanges();

    expect(panel().classList).toContain('mat-expanded');
  });

  it('asks for an audit step when the steps measure nothing', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);
    const host: HTMLElement = builderFixture.nativeElement;
    const form = builderFixture.componentInstance.formGroup;

    form.controls.steps.at(1).get('url')?.setValue('https://example.com');
    form.removeStepAt(2);
    form.removeStepAt(0);
    builderFixture.componentRef.changeDetectorRef.markForCheck();
    builderFixture.detectChanges();
    expect(form.valid).toBe(true);

    submitForm(builderFixture);
    await builderFixture.whenStable();
    builderFixture.detectChanges();

    expect(submitAudit).not.toHaveBeenCalled();
    expect(host.querySelector('.action-bar__problem')?.textContent?.trim()).toBe('errorAdd an audit step');
    expect(document.activeElement).toBe(host.querySelector('.steps__add'));
  });

  it('shows why a run was rejected beside the Run audit button', async () => {
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    const host: HTMLElement = builderFixture.nativeElement;
    expect(host.querySelector('[data-testid="audit-inline-error"]')).toBeNull();

    builderFixture.componentRef.setInput('errorMessage', 'The runner is unavailable. Try again.');
    builderFixture.detectChanges();

    expect(host.querySelector('.action-bar [data-testid="audit-inline-error"]')?.textContent).toContain(
      'The runner is unavailable. Try again.',
    );
  });

  it('does not submit after a required field becomes invalid', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);

    const titleInput = builderFixture.nativeElement.querySelector('input[name="audit title"]') as HTMLInputElement;
    titleInput.value = '';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    builderFixture.detectChanges();

    submitForm(builderFixture);

    expect(submitAudit).not.toHaveBeenCalled();
  });
});

function submitForm(fixture: ComponentFixture<AuditBuilderComponent>): void {
  const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  fixture.detectChanges();
}
