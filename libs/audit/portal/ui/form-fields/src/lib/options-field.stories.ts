import { FormControl } from '@angular/forms';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { provideAuditBuilderIcons } from '@app-speed/audit/portal/ui/icons';
import {
  LIGHTHOUSE_AUDIT_STEP_TYPE,
  PUPPETEER_REPLAY_ASSERTION_STEP_TYPE,
  PUPPETEER_REPLAY_USER_STEP_TYPE,
  STEP_TYPE,
} from '@app-speed/audit/domain';
import type { OptionsFieldModel } from './field.model';
import { OptionsField } from './options-field';

const BUTTON_PROPERTY: OptionsFieldModel['property'] = {
  name: 'button',
  inputType: 'options',
  options: ['primary', 'auxiliary', 'secondary', 'back', 'forward'],
};

const TYPE_PROPERTY: OptionsFieldModel['property'] = {
  name: 'type',
  inputType: 'options',
  options: [
    '',
    {
      label: 'Audit Steps',
      icon: 'lighthouse-badge',
      options: Object.values(LIGHTHOUSE_AUDIT_STEP_TYPE),
    },
    {
      label: 'Assertion Steps',
      icon: 'puppeteer-badge',
      options: Object.values(PUPPETEER_REPLAY_ASSERTION_STEP_TYPE),
    },
    {
      label: 'Action Steps',
      icon: 'puppeteer-badge',
      options: Object.values(PUPPETEER_REPLAY_USER_STEP_TYPE),
    },
  ],
};

const meta: Meta<OptionsField> = {
  title: 'Patterns/Audit Builder/Fields/Options',
  component: OptionsField,
  decorators: [applicationConfig({ providers: [provideAuditBuilderIcons()] })],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<OptionsField>;

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

const createStory = (field: {
  property: OptionsFieldModel['property'];
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
  property: BUTTON_PROPERTY,
  value: 'secondary',
});

export const Grouped: Story = createStory({
  property: TYPE_PROPERTY,
  value: STEP_TYPE.NAVIGATE,
});
