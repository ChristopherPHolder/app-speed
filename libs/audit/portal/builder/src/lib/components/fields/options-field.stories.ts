import { FormControl } from '@angular/forms';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import type { OptionsFieldModel } from '@app-speed/audit-builder-ui/form-fields';
import { provideAuditBuilderIcons } from '@app-speed/audit-builder-ui/icons';
import { STEP_PROPERTY, STEP_TYPE } from '@app-speed/audit/model';
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
  property: OptionsFieldModel['property'];
  value: string | boolean;
  removable?: boolean;
}): OptionsFieldModel => ({
  name: property.name,
  property,
  control: new FormControl(value, { nonNullable: true }),
  removable,
});

const createStory = (
  field: { property: OptionsFieldModel['property']; value: string | boolean; removable?: boolean },
): Story => ({
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
