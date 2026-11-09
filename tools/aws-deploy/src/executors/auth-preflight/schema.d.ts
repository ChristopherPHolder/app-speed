export interface AuthPreflightExecutorSchema {
  application: 'api' | 'portal';
  environment: 'development' | 'production';
  portalOrigin: string;
}
