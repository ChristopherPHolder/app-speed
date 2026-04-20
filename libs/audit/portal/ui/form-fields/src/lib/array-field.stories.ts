import { FormArray, FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import type { ArrayFieldModel } from './field.model';
import { ArrayField } from './array-field';

const SELECTORS_PROPERTY: ArrayFieldModel['property'] = {
  name: 'selectors',
  inputType: 'stringArray',
};

const meta: Meta<ArrayField> = {
  title: 'Patterns/Audit Builder/Fields/Array',
  component: ArrayField,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<ArrayField>;

const createControl = (values: string[]): FormArray<FormControl<string>> =>
  new FormArray<FormControl<string>>(values.map((value) => new FormControl(value, { nonNullable: true })));

const createField = ({
  property,
  control,
}: {
  property: ArrayFieldModel['property'];
  control: FormArray<FormControl<string>>;
}): ArrayFieldModel => ({
  name: property.name,
  property,
  control,
  removable: false,
});

const createStory = ({
  property,
  control,
}: {
  property: ArrayFieldModel['property'];
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
  property: SELECTORS_PROPERTY,
  control: createControl(['aria/Search input']),
});

export const MultipleItems: Story = createStory({
  property: SELECTORS_PROPERTY,
  control: createControl(['aria/Search input', 'input[name="query"]', '#search']),
});
