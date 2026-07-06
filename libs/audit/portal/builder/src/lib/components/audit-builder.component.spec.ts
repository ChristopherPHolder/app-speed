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

  it('does not emit a submit when the primary action is Fork', async () => {
    const submitAudit = vi.fn();
    const builderFixture = await renderBuilder({ modifying: false, primaryAction: 'fork' });
    builderFixture.componentInstance.submitAudit.subscribe(submitAudit);

    submitForm(builderFixture);

    expect(submitAudit).not.toHaveBeenCalled();
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
