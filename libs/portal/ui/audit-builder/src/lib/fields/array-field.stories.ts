import { FormArray, FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { STEP_PROPERTY, StepProperty } from '@app-speed/shared-user-flow-replay';
import { StepField } from '../audit-builder-form';
import { ArrayFieldComponent } from './array-field.component';

const meta: Meta<ArrayFieldComponent> = {
  title: 'Patterns/Audit Builder/Fields/Array',
  component: ArrayFieldComponent,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ArrayFieldComponent>;

const createControl = (values: string[]): FormArray<FormControl<string>> =>
  new FormArray<FormControl<string>>(values.map((value) => new FormControl(value, { nonNullable: true })));

const createField = ({
  property,
  control,
}: {
  property: StepProperty;
  control: FormArray<FormControl<string>>;
}): StepField<FormArray<FormControl<string>>> => ({
  name: property.name,
  property,
  control,
  removable: false,
});

const createStory = ({
  property,
  control,
}: {
  property: StepProperty;
  control: FormArray<FormControl<string>>;
}): Story => ({
  render: () => ({
    props: {
      field: createField({
        property,
        control,
      }),
    },
  }),
});

export const SingleItem: Story = createStory({
  property: STEP_PROPERTY.selectors,
  control: createControl(['aria/Search input']),
});

export const MultipleItems: Story = createStory({
  property: STEP_PROPERTY.selectors,
  control: createControl(['aria/Search input', 'input[name="query"]', '#search']),
});
