export type EffectDiagnosticsFormat = 'json' | 'pretty' | 'text' | 'github-actions';

export interface EffectDiagnosticsExecutorSchema {
  tsConfig?: string;
  file?: string;
  format?: EffectDiagnosticsFormat;
  severity?: string;
  strict?: boolean;
  progress?: boolean;
  cwd?: string;
  outputFile?: string;
  args?: string[];
}
