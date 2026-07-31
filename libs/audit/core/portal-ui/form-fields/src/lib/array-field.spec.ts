import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArrayField } from './array-field';
import type { ArrayFieldModel } from './field.model';

describe('ArrayField', () => {
  let component: ArrayField;
  let fixture: ComponentFixture<ArrayField>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ArrayField],
    });

    fixture = TestBed.createComponent(ArrayField);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.componentRef.setInput('field', createField(['aria/Search input']));
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('adds a control before the last item', () => {
    const field = createField(['first', 'last']);
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();

    component.addControl();

    expect(field.control.length).toBe(3);
    expect(field.control.at(1).value).toBe('');
    expect(field.control.at(2).value).toBe('last');
  });

  it('removes a control by index', () => {
    const field = createField(['first', 'middle', 'last']);
    fixture.componentRef.setInput('field', field);
    fixture.detectChanges();

    component.removeControl(1);

    expect(field.control.length).toBe(2);
    expect(field.control.controls.map((control) => control.value)).toEqual(['first', 'last']);
  });
});

function createField(values: string[]): ArrayFieldModel {
  return {
    name: 'selectors',
    property: {
      name: 'selectors',
      inputType: 'stringArray',
    },
    control: new FormArray<FormControl<string>>(values.map((value) => new FormControl(value, { nonNullable: true }))),
    removable: false,
  };
}
