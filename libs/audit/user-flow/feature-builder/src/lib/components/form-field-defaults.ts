import type { Provider } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, type MatFormFieldDefaultOptions } from '@angular/material/form-field';

/**
 * Form field defaults for the builder. Every field it shows is either required or an optional property
 * that was added on purpose and has a remove button, so a required marker tells nothing apart.
 */
export const provideBuilderFormFieldDefaults = (): Provider => ({
  provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
  useValue: { appearance: 'outline', hideRequiredMarker: true } satisfies MatFormFieldDefaultOptions,
});
