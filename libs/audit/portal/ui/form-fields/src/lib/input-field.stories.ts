import { FormControl } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { STEP_PROPERTY } from '@app-speed/audit/domain';
import type { InputFieldModel } from './field.model';
import { InputField } from './input-field';

const meta: Meta<InputField> = {
  title: 'Patterns/Audit Builder/Fields/Input',
  component: InputField,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<InputField>;

const createField = ({
  property,
  control,
}: {
  property: InputFieldModel['property'];
  control: FormControl;
}): InputFieldModel => ({
  name: property.name,
  property,
  control,
  removable: false,
});

const createStory = ({
  property,
  control,
}: {
  property: InputFieldModel['property'];
  control: FormControl;
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

export const Text: Story = createStory({
  property: STEP_PROPERTY.name,
  control: new FormControl('Homepage audit', { nonNullable: true }),
});

export const Number: Story = createStory({
  property: STEP_PROPERTY.timeout,
  control: new FormControl(30000, { nonNullable: true }),
});
