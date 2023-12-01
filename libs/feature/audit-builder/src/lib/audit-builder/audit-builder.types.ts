export type DeviceOption = 'mobile' | 'tablet' | 'desktop';

export interface AuditDetails  {
  title: string;
  device: DeviceOption;
  timeout: number
  steps: any[]
}
