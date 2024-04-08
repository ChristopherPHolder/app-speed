import { readFileSync } from 'fs';
import { cwd } from 'process';


export const readJSONFromFile = (path: string, errorMessage?: string): Record<string, unknown> => {
  try {
    const data = readFileSync(path, 'utf8');
    return JSON.parse(data);
  } catch {
    const errorBase = errorMessage || '';
    throw new Error(errorBase + `Error reading or parsing JSON from ${path}. Current working directory: ${ cwd() }`);
  }
}
