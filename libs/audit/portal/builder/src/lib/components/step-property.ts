import { AbstractControl, FormArray, FormControl, FormRecord, Validators } from '@angular/forms';
import { PropertyName, STEP_PROPERTY } from '@app-speed/audit/portal/model';

const stringFormControlFactory = (defaultValue: string) =>
  new FormControl(defaultValue, {
    validators: [Validators.required, Validators.minLength(1)],
    nonNullable: true,
  });

const numberFormControlFactory = (defaultValue: number) =>
  new FormControl<number>(defaultValue, {
    validators: [Validators.required, Validators.max(60_000), Validators.min(1)],
    nonNullable: true,
  });

const booleanFormControlFactory = (defaultValue: boolean) =>
  new FormControl<boolean>(defaultValue, {
    validators: [Validators.required],
    nonNullable: true,
  });

export const stepPropertyFactoryMap = {
  type: (step?: { type?: string }) => stringFormControlFactory(step?.type ?? ''),
  timeout: (step?: { timeout?: number }) =>
    numberFormControlFactory(step?.timeout ?? STEP_PROPERTY.timeout.defaultValue),
  value: (step?: { value?: string }) => stringFormControlFactory(step?.value ?? ''),
  selectors: (step?: { selectors?: string[] }) =>
    new FormArray<FormControl<string>>(
      (step?.selectors ?? ['']).map((selector) => stringFormControlFactory(selector)),
      { validators: [Validators.required, Validators.minLength(1)] },
    ),
  attributes: (..._args: any) => {
    console.warn('Warning Attribute step property is not yet implemented');
    return new FormRecord({}); // TODO
  },
  count: (step?: { count?: number }) => numberFormControlFactory(step?.count ?? 1),
  visible: (step?: { visible?: boolean }) => booleanFormControlFactory(step?.visible ?? true),
  operator: (step?: { operator?: string }) =>
    stringFormControlFactory(step?.operator ?? STEP_PROPERTY.operator.defaultValue),
  assertedEvents: (..._args: any) => {
    console.warn('Warning assertedEvents step property is not yet implemented');
    return new FormArray([]); // TODO
  },
  frame: (step?: { frame?: number[] }) =>
    new FormArray<FormControl<number>>(
      (step?.frame?.length ? step.frame : [0]).map((f) => numberFormControlFactory(f)),
      { validators: [Validators.required, Validators.min(1)] },
    ),
  expression: (step?: { expression?: string }) => stringFormControlFactory(step?.expression ?? ''),
  target: (step?: { target?: string }) => stringFormControlFactory(step?.target ?? ''),
  properties: (_step?: { property?: any }) => {
    console.warn('Warning properties step property is not yet implemented');
    return new FormArray([]); // TODO
  },
  button: (step?: { button?: string }) => stringFormControlFactory(step?.button ?? 'primary'),
  deviceType: (step?: { deviceType?: string }) => stringFormControlFactory(step?.deviceType ?? 'mouse'),
  duration: (step?: { duration?: number }) => numberFormControlFactory(step?.duration ?? 1),
  offsetX: (step?: { offsetX?: number }) => numberFormControlFactory(step?.offsetX ?? 1),
  offsetY: (step?: { offsetY?: number }) => numberFormControlFactory(step?.offsetY ?? 1),
  download: (step?: { download?: number }) => numberFormControlFactory(step?.download ?? 1),
  latency: (step?: { latency: number }) => numberFormControlFactory(step?.latency ?? 1),
  upload: (step?: { upload?: number }) => numberFormControlFactory(step?.upload ?? 1),
  key: (step?: { key?: string }) => stringFormControlFactory(step?.key ?? ''),
  url: (step?: { url?: string }) =>
    new FormControl<string>(step?.url ?? '', {
      validators: [
        Validators.required,
        Validators.pattern(
          /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*$/,
        ),
      ],
      nonNullable: true,
    }),
  x: (step?: { x: number }) => numberFormControlFactory(step?.x ?? 1),
  y: (step?: { y: number }) => numberFormControlFactory(step?.y ?? 1),
  deviceScaleFactor: (step?: { deviceScaleFactor: number }) => numberFormControlFactory(step?.deviceScaleFactor ?? 1),
  hasTouch: (step?: { hasTouch?: boolean }) => booleanFormControlFactory(step?.hasTouch ?? false),
  height: (step?: { height: number }) => numberFormControlFactory(step?.height ?? 1),
  isLandscape: (step?: { isLandscape: boolean }) => booleanFormControlFactory(step?.isLandscape ?? false),
  isMobile: (step?: { isMobile: boolean }) => booleanFormControlFactory(step?.isMobile ?? false),
  width: (step?: { width: number }) => numberFormControlFactory(step?.width ?? 1),
  name: (step?: { name: string }) => stringFormControlFactory(step?.name ?? ''),
} as const satisfies Record<PropertyName, () => AbstractControl>;
