import { FormControl, Validators } from '@angular/forms';
import type { Meta, StoryObj } from '@storybook/angular';
import { STEP_PROPERTY, StepProperty } from '@app-speed/audit/model';
import { StepField } from '../audit-builder-form';
import { InputFieldComponent } from './input-field.component';

const meta: Meta<InputFieldComponent> = {
  title: 'Patterns/Audit Builder/Fields/Input',
  component: InputFieldComponent,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<InputFieldComponent>;

const createField = ({
  property,
  control,
}: {
  property: StepProperty;
  control: FormControl;
}): StepField<FormControl> => ({
  name: property.name,
  property,
  control,
  removable: false,
});

const createStory = ({ property, control }: { property: StepProperty; control: FormControl }): Story => ({
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
