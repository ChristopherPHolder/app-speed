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
      host.querySelectorAll<HTMLButtonElement>('[aria-label="Toggle menu"]')[index].click();
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

    await menuAction(0, 'Add Step After');
    expect(steps.length).toBe(4);
    expect(steps.at(1).selectionControl.value).toBe('');
    expect(steps.at(2)).toBe(navigateStep);

    await menuAction(0, 'Add Step Before');
    expect(steps.length).toBe(5);
    expect(steps.at(0).selectionControl.value).toBe('');
    expect(steps.at(1)).toBe(firstStep);

    await menuAction(0, 'Remove Step');
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

  it('hides step menus in read-only mode', async () => {
    const builderFixture = await renderBuilder({ modifying: false, primaryAction: 'fork' });
    const host: HTMLElement = builderFixture.nativeElement;
    expect(host.querySelector('[aria-label="Toggle menu"]')).toBeNull();
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

  it('shows readiness guidance and disables running when an incomplete step is inserted', async () => {
    const builderFixture = await renderBuilder({ modifying: true, primaryAction: 'analyze' });
    const host: HTMLElement = builderFixture.nativeElement;
    const form = builderFixture.componentInstance.formGroup;
    const actionText = () => host.querySelector('.action-bar')?.textContent;
    expect(actionText()).toContain('3 steps');
    expect(actionText()).toContain('Complete the required fields in step 2');

    form.controls.steps.at(1).get('url')?.setValue('https://example.com');
    builderFixture.detectChanges();
    expect(actionText()).toContain('Ready to run your audit.');
    expect(host.querySelector<HTMLButtonElement>('.submit-btn')?.disabled).toBe(false);

    host.querySelector<HTMLButtonElement>('[aria-label="Toggle menu"]')?.click();
    builderFixture.detectChanges();
    await builderFixture.whenStable();
    const addAfter = Array.from(document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')).find(
      (button) => button.textContent?.trim() === 'Add Step After',
    );
    if (!addAfter) throw new Error('Missing Add Step After menu action');
    addAfter.click();
    builderFixture.detectChanges();
    await builderFixture.whenStable();
    expect(actionText()).toContain('4 steps');
    expect(actionText()).toContain('Complete the required fields in step 2');
    expect(host.querySelector<HTMLButtonElement>('.submit-btn')?.disabled).toBe(true);

    const titleInput = host.querySelector<HTMLInputElement>('input[name="audit title"]');
    if (!titleInput) throw new Error('Missing audit title input');
    titleInput.value = '';
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    builderFixture.detectChanges();
    expect(actionText()).toContain('Add an audit title to continue.');
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
