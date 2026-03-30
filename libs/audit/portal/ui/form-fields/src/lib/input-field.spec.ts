import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { InputFieldModel } from './field.model';
import { InputField } from './input-field';

describe('InputField', () => {
  let component: InputField;
  let fixture: ComponentFixture<InputField>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InputField],
    });

    fixture = TestBed.createComponent(InputField);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.componentRef.setInput('field', createField({ name: 'title', inputType: 'string' }, 'Homepage audit'));
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('renders a number input for numeric fields', () => {
    fixture.componentRef.setInput('field', createField({ name: 'timeout', inputType: 'number' }, 30000));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const input = compiled.querySelector('input');

    expect(compiled.textContent).toContain('Timeout');
    expect(input?.getAttribute('type')).toBe('number');
  });
});

function createField(property: InputFieldModel['property'], value: string | number): InputFieldModel {
  return {
    name: property.name,
    property,
    control: new FormControl(value, { nonNullable: true }),
    removable: false,
  };
}
