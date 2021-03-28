import fs from 'fs';
import { bindNodeCallback } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { map, mergeMap } from 'rxjs/operators';

export interface Identifiable {
  id: string;
  type: string;
}

const DB = 'db.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readFile$ = bindNodeCallback<string, any, string>(fs.readFile);
const writeFile$ = bindNodeCallback(fs.writeFile);

function readRecords$<T extends Identifiable>(file: string): Observable<T[]> {
  return readFile$(file, { encoding: 'utf8' }).pipe(map((buffer) => JSON.parse(buffer) as T[]));
}

export function findAll$<T extends Identifiable>(type: string): Observable<T[]> {
  return readRecords$(DB).pipe(map((objs) => objs.filter((obj) => obj.type === type) as T[]));
}

export function writeRecords$<T extends Identifiable>(records: T[]): Observable<void> {
  return readRecords$(DB).pipe(
    map((objs) =>
      objs.map((obj) => {
        const record = records.find((el) => el.id === obj.id);
        if (record !== undefined) {
          return {...obj, ...record};
        }
        return obj;
      })
    ),
    map(objs => ([...objs, ...records.filter(el => objs.findIndex(obj => obj.id === el.id) === -1)])),
    mergeMap((objs) => writeFile$(DB, JSON.stringify(objs, null, 2)))
  );
}
