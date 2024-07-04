import {  spawn } from 'node:child_process';

export type CliProcessOutput = {
    stdout: string;
    stderr: string;
    code: number | null;
}

export const cliProcess = (command: string) => {
    return new Promise<CliProcessOutput>((resolve) => {
        const process = spawn(command, [], { stdio: 'pipe', shell: true });

        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => stdout += String(data));
        process.stderr.on('data', (data) => stderr += String(data));
        process.on('close', code => resolve({ stdout, stderr, code }));
    })
}
