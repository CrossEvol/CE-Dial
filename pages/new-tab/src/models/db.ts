import Dexie, { type Table } from 'dexie';
import type { DialItem } from './DialItem';
import type { GroupItem } from './GroupItem';
import { populate } from './populate';

export class AppDB extends Dexie {
  dials!: Table<DialItem, number>;
  groups!: Table<GroupItem, number>;

  constructor() {
    super('AppDB');
    this.version(1).stores({
      dials: '++id, groupId, pos,url, title, thumbSourceType',
      groups: '++id, name, pos, is_selected',
    });
  }
}

export const db = new AppDB();

// Only call populate when the database is created for the first time
db.on('populate', populate);

export function resetDatabase() {
  return db.transaction('rw', db.dials, db.groups, async () => {
    await Promise.all(db.tables.map(table => table.clear()));
    await populate();
  });
}
