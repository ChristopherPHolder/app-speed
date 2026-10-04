import { TestBed } from '@angular/core/testing';
import { BuilderStepFormGroup, findStepSpec } from '../step-form';
import { StepFieldsComponent } from './step-fields.component';

describe('StepFieldsComponent selectors', () => {
  async function render(value?: Record<string, unknown>, readonly = false) {
    const form = new BuilderStepFormGroup(findStepSpec('click'), value);
    if (readonly) form.disable();
    await TestBed.configureTestingModule({ imports: [StepFieldsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(StepFieldsComponent);
    fixture.componentRef.setInput('variantId', 'click');
    fixture.componentRef.setInput('fields', form.spec.fields);
    fixture.componentRef.setInput('control', form);
    fixture.componentRef.setInput('stepForm', form);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const inputs = () => Array.from(host.querySelectorAll<HTMLInputElement>('.selector-fields input'));
    const click = async (selector: string) => {
      const button = host.querySelector<HTMLButtonElement>(selector);
      if (!button) throw new Error(`Missing selector control: ${selector}`);
      button.click();
      await fixture.whenStable();
    };
    const enter = async (index: number, text: string) => {
      inputs()[index].value = text;
      inputs()[index].dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
    };
    return { form, host, inputs, click, enter };
  }

  afterEach(() => TestBed.resetTestingModule());

  it('starts with an outlined required selector and validates it before submission', async () => {
    const { form, host, inputs, enter } = await render();
    expect(inputs()).toHaveLength(1);
    expect(inputs()[0].required).toBe(true);
    expect(host.querySelector('.selector-fields .mat-mdc-form-field')?.classList).toContain(
      'mat-form-field-appearance-outline',
    );
    expect(form.invalid).toBe(true);
    await enter(0, '#checkout');
    expect(form.valid).toBe(true);
    expect(form.getRawValue().selectors).toEqual([{ segments: ['#checkout'] }]);
    await enter(0, '');
    expect(form.invalid).toBe(true);
  });

  it('edits alternatives and multi-part paths while preserving the replay authoring structure', async () => {
    const { form, host, inputs, click, enter } = await render({
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [{ segments: ['main', '#checkout'] }],
    });
    expect(inputs().map((input) => input.value)).toEqual(['main', '#checkout']);
    expect(host.querySelector('.selector-path')?.textContent).toContain('Parent selector');
    expect(host.querySelector('.selector-path')?.textContent).toContain('Target selector');
    expect(host.querySelector('.selector-segment--child')).not.toBeNull();
    await click('.selector-fields__add');
    await enter(2, 'aria/Checkout');
    await click('.selector-path__add');
    await enter(2, 'button');
    expect(form.getRawValue().selectors).toEqual([
      { segments: ['main', '#checkout', 'button'] },
      { segments: ['aria/Checkout'] },
    ]);
    await click('[aria-label="Remove selector segment"]');
    await click('[aria-label="Remove selector"]');
    expect(form.getRawValue().selectors).toEqual([{ segments: ['aria/Checkout'] }]);
    expect(inputs()).toHaveLength(1);
  });

  it('disables selectors and hides editing actions for read-only audits', async () => {
    const { host, inputs } = await render({ type: 'click', selectors: [{ segments: ['#checkout'] }] }, true);
    expect(inputs()[0].value).toBe('#checkout');
    expect(inputs()[0].disabled).toBe(true);
    expect(host.querySelector('.selector-fields button')).toBeNull();
  });
});
