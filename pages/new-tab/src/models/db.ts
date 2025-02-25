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
      dials: '++id, groupId, url, title, thumbSourceType',
      groups: '++id, name, order',
    });
  }

  deleteGroup(groupId: number) {
    return this.transaction('rw', this.dials, this.groups, () => {
      this.dials.where({ groupId }).delete();
      this.groups.delete(groupId);
    });
  }
}

export const db = new AppDB();

db.on('populate', populate);

export function resetDatabase() {
  return db.transaction('rw', db.dials, db.groups, async () => {
    await Promise.all(db.tables.map(table => table.clear()));
    await populate();
  });
}
