export interface AlchemyExecutorSchema {
  stack: string;
  stage: 'development' | 'production';
  command?: 'deploy' | 'plan';
  force?: boolean;
}
