import { execSync } from 'child_process';

export const commandOutput = (command: string) => execSync(command).toString();
