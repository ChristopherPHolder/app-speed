import { TestBed } from '@angular/core/testing';
import { BuilderStepFormGroup, findStepSpec } from '../step-form';
import { StepFieldsComponent } from './step-fields.component';

async function renderStep(variantId: string, value?: Record<string, unknown>, readonly = false) {
  const form = new BuilderStepFormGroup(findStepSpec(variantId), value);
  if (readonly) form.disable();
  await TestBed.configureTestingModule({ imports: [StepFieldsComponent] }).compileComponents();
  const fixture = TestBed.createComponent(StepFieldsComponent);
  fixture.componentRef.setInput('variantId', variantId);
  fixture.componentRef.setInput('fields', form.spec.fields);
  fixture.componentRef.setInput('control', form);
  fixture.componentRef.setInput('stepForm', form);
  await fixture.whenStable();
  const host: HTMLElement = fixture.nativeElement;
  const click = async (selector: string) => {
    const button = host.querySelector<HTMLElement>(selector);
    if (!button) throw new Error(`Missing control: ${selector}`);
    button.click();
    await fixture.whenStable();
  };
  const type = async (input: HTMLInputElement | null | undefined, text: string) => {
    if (!input) throw new Error('Missing input');
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  };
  /** The form field whose label is exactly `label`. */
  const field = (label: string) =>
    Array.from(host.querySelectorAll<HTMLElement>('mat-form-field')).find(
      (candidate) => candidate.querySelector('mat-label')?.textContent?.trim() === label,
    );
  return { form, fixture, host, click, type, field };
}

describe('StepFieldsComponent selectors', () => {
  async function render(value?: Record<string, unknown>, readonly = false) {
    const { form, host, click, type } = await renderStep('click', value, readonly);
    const inputs = () => Array.from(host.querySelectorAll<HTMLInputElement>('.selector-fields input'));
    const enter = (index: number, text: string) => type(inputs()[index], text);
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

describe('StepFieldsComponent field types', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('stores numbers typed into a list item as numbers', async () => {
    const { form, host, type } = await renderStep('click', {
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [{ segments: ['#checkout'] }],
      frame: [0],
    });
    const item = host.querySelector<HTMLInputElement>('.group-field input');
    expect(item?.type).toBe('number');

    await type(item, '2');

    expect(form.getRawValue().frame).toEqual([2]);
    expect(form.valid).toBe(true);
  });

  it('explains what is wrong with a list item', async () => {
    const { form, fixture, host, type } = await renderStep('click', {
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [{ segments: ['#checkout'] }],
      frame: [0],
    });
    const item = host.querySelector<HTMLInputElement>('.group-field input');

    await type(item, '1.5');
    item?.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(form.invalid).toBe(true);
    expect(host.querySelector('.group-field mat-error')?.textContent).toContain('Enter a whole number.');
  });

  it('edits boolean properties with a checkbox', async () => {
    const { form, host, click } = await renderStep('waitForElement', {
      type: 'waitForElement',
      count: 1,
      selectors: [{ segments: ['#result'] }],
      visible: true,
    });
    const checkbox = host.querySelector<HTMLInputElement>('mat-checkbox input[type="checkbox"]');
    expect(checkbox?.checked).toBe(true);
    expect(host.querySelector('mat-checkbox')?.textContent?.trim()).toBe('Visible');
    expect(host.querySelector('mat-select')).toBeNull();

    await click('mat-checkbox input[type="checkbox"]');

    expect(form.getRawValue().visible).toBe(false);
  });

  it('edits the value of a key/value entry', async () => {
    const { form, host, type } = await renderStep('waitForElement', {
      type: 'waitForElement',
      count: 1,
      selectors: [{ segments: ['#result'] }],
      attributes: { 'aria-expanded': 'false' },
    });
    const value = host.querySelector<HTMLInputElement>('.field-row--record input');
    expect(value?.value).toBe('false');

    await type(value, 'true');

    expect(form.getRawValue().attributes).toEqual({ 'aria-expanded': 'true' });
  });

  it('disables every control for read-only audits', async () => {
    const { host } = await renderStep(
      'waitForElement',
      { type: 'waitForElement', count: 1, selectors: [{ segments: ['#result'] }], visible: true, frame: [1] },
      true,
    );
    expect(host.querySelector<HTMLInputElement>('mat-checkbox input')?.disabled).toBe(true);
    expect(host.querySelector<HTMLInputElement>('.group-field input')?.disabled).toBe(true);
    expect(host.querySelector('.group-field button')).toBeNull();
  });

  it('flags a blank optional property', async () => {
    const { form, fixture, field } = await renderStep('click', {
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [{ segments: ['#checkout'] }],
      button: '',
      timeout: null,
    });
    form.markAllAsTouched();
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(form.invalid).toBe(true);
    expect(field('Mouse button')?.querySelector('mat-error')?.textContent?.trim()).toBe('Choose an option.');
    expect(field('Timeout (ms)')?.querySelector('mat-error')?.textContent?.trim()).toBe('Enter a value.');
  });

  it('names the accepted URL formats', async () => {
    const { form, fixture, field } = await renderStep('navigate', { type: 'navigate', url: 'http://example.com' });
    form.markAllAsTouched();
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(field('URL')?.querySelector('mat-error')?.textContent?.trim()).toBe('Enter an https:// URL or about:blank.');
  });

  it('labels list items, enum options and remove buttons for what they are', async () => {
    const { host, field } = await renderStep('click', {
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [{ segments: ['#checkout'] }],
      button: 'primary',
      frame: [0, 1],
      assertedEvents: [{ type: 'navigation', title: 'Checkout' }],
    });
    const text = (selector: string) =>
      Array.from(host.querySelectorAll(selector), (element) => element.textContent?.trim());
    const ariaLabels = Array.from(host.querySelectorAll('button[aria-label]'), (button) =>
      button.getAttribute('aria-label'),
    );

    expect(field('Frame index 1')).toBeDefined();
    expect(field('Frame index 2')).toBeDefined();
    expect(text('.array-item__header h5')).toEqual(['Asserted event 1']);
    expect(field('Mouse button')?.textContent).toContain('Primary');
    expect(text('.group-field__add')).toEqual(['addAdd asserted event', 'addAdd frame index']);
    expect(ariaLabels).toEqual(
      expect.arrayContaining([
        'Remove mouse button',
        'Remove frame',
        'Remove frame index 2',
        'Remove asserted events',
        'Remove asserted event 1',
        'Remove navigation title',
      ]),
    );
    // The event type has a single possible value, so it is carried by the form but not shown.
    expect(field('Type')).toBeUndefined();
    expect(text('.optional-fields h4')).toContain('Optional properties');
  });
});

describe('StepFieldsComponent key/value properties', () => {
  afterEach(() => TestBed.resetTestingModule());

  const waitForElement = (attributes: Record<string, string> = {}) =>
    renderStep('waitForElement', {
      type: 'waitForElement',
      count: 1,
      selectors: [{ segments: ['#result'] }],
      attributes,
    });

  it('adds an entry with its value when Enter is pressed, without submitting the audit', async () => {
    const { form, fixture, host, type, field } = await waitForElement();
    const name = field('Attribute name')?.querySelector('input');
    const value = field('Value')?.querySelector('input');

    await type(name, ' aria-expanded ');
    await type(value, 'true');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    value?.dispatchEvent(enter);
    await fixture.whenStable();

    expect(enter.defaultPrevented).toBe(true);
    expect(form.getRawValue().attributes).toEqual({ 'aria-expanded': 'true' });
    expect(name?.value).toBe('');
    expect(value?.value).toBe('');
    expect(document.activeElement).toBe(name);
    // The entry is one field, labelled with its name.
    expect(field('aria-expanded')?.querySelector('input')?.value).toBe('true');
    expect(host.querySelector('[aria-label="Remove attribute aria-expanded"]')).not.toBeNull();
  });

  it('explains why a blank or duplicate name was not added', async () => {
    const { form, fixture, click, type, field } = await waitForElement({ role: 'dialog' });
    const name = field('Attribute name')?.querySelector('input');
    const error = () => field('Attribute name')?.querySelector('mat-error')?.textContent?.trim();

    await click('.record-add__button');
    fixture.detectChanges();
    expect(error()).toBe('Enter a name.');

    await type(name, 'role');
    await click('.record-add__button');
    fixture.detectChanges();
    expect(error()).toBe('Attribute “role” is already listed.');
    expect(form.getRawValue().attributes).toEqual({ role: 'dialog' });

    await type(name, 'role2');
    expect(error()).toBeUndefined();
  });

  it('removes an entry and hides the add row for read-only audits', async () => {
    const { form, fixture, host, click } = await waitForElement({ role: 'dialog' });

    await click('[aria-label="Remove attribute role"]');
    expect(form.getRawValue().attributes).toEqual({});

    form.disable();
    fixture.componentRef.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(host.querySelector('.record-add')).toBeNull();
  });
});
