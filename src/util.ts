import fs from 'fs';
import { bindNodeCallback } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const readFile$ = bindNodeCallback<string, any, string>(fs.readFile);
export const writeFile$ = bindNodeCallback(fs.writeFile);
