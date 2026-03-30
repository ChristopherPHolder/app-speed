import { FormControl } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { OptionsFieldModel } from './field.model';
import { OptionsField } from './options-field';

describe('OptionsField', () => {
  let component: OptionsField;
  let fixture: ComponentFixture<OptionsField>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OptionsField],
    });

    fixture = TestBed.createComponent(OptionsField);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.componentRef.setInput('field', createField('button', ['primary', 'secondary'], 'secondary'));
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('falls back to an empty option list when none are provided', () => {
    fixture.componentRef.setInput('field', createField('button', undefined, 'secondary'));
    fixture.detectChanges();

    expect((component as { options: () => unknown[] }).options()).toEqual([]);
  });
});

function createField(
  name: string,
  options: OptionsFieldModel['property']['options'],
  value: string | boolean,
): OptionsFieldModel {
  return {
    name,
    property: {
      name,
      inputType: 'options',
      options,
    },
    control: new FormControl(value, { nonNullable: true }),
    removable: false,
  };
}
