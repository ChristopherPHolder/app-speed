export interface DrizzleKitExecutorSchema {
  command: string;
  config?: string;
  cwd?: string;
  args?: string[];
}
