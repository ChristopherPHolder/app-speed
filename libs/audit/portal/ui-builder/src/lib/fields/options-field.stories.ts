import { FormControl } from '@angular/forms';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { STEP_PROPERTY, STEP_TYPE, StepProperty } from '@app-speed/audit/model';
import { StepField } from '../audit-builder-form';
import { provideAuditBuilderIcons } from '../audit-builder-icons.provider';
import { OptionsFieldComponent } from './options-field.component';

const meta: Meta<OptionsFieldComponent> = {
  title: 'Patterns/Audit Builder/Fields/Options',
  component: OptionsFieldComponent,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<OptionsFieldComponent>;

const createField = ({
  property,
  value,
  removable = false,
}: {
  property: StepProperty;
  value: string | boolean;
  removable?: boolean;
}): StepField<FormControl> => ({
  name: property.name,
  property,
  control: new FormControl(value, { nonNullable: true }),
  removable,
});

const createStory = (field: {
  property: StepProperty;
  value: string | boolean;
  removable?: boolean;
}): Story => ({
  render: () => ({
    props: {
      field: createField(field),
    },
  }),
});

export const Flat: Story = createStory({
  property: STEP_PROPERTY.button,
  value: 'secondary',
});

export const Grouped: Story = createStory({
  property: STEP_PROPERTY.type,
  value: STEP_TYPE.NAVIGATE,
});
