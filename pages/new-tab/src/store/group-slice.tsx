import { type StateCreator } from 'zustand';
import type { GroupItem } from '../models';
import { db } from '../models';

export interface GroupSlice {
  groups: GroupItem[];
  // Actions
  fetchGroups: () => Promise<void>;
  addGroup: (name: string, position: 'top' | 'bottom') => Promise<number>;
  updateGroup: (id: number, updates: Partial<GroupItem>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  setSelectedGroup: (id: number) => Promise<void>;
  reorderGroups: (reorderedGroups: GroupItem[]) => Promise<void>;

  // Export/Import related
  exportGroups: () => Promise<Omit<GroupItem, 'id' | 'createdAt' | 'updatedAt'>[]>;
  importGroups: (groups: Omit<GroupItem, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<Map<string, number>>;
}

export const createGroupSlice: StateCreator<GroupSlice> = (set, get) => ({
  groups: [],

  fetchGroups: async () => {
    const groups = await db.groups.orderBy('pos').toArray();
    set({ groups });
  },

  addGroup: async (name, position) => {
    // Get all groups to determine position
    const allGroups = await db.groups.toArray();

    let pos = 0;
    if (position === 'bottom') {
      // Find the highest position value and add 1
      pos = allGroups.length > 0 ? Math.max(...allGroups.map(g => g.pos || 0)) + 1 : 0;
    } else if (position === 'top') {
      // Set to 0 and increment all other groups
      pos = 0;
      // Update all existing groups to increment their position
      for (const group of allGroups) {
        await db.groups.update(group.id!, {
          pos: (group.pos || 0) + 1,
          updatedAt: new Date(),
        });
      }
    }

    const newGroup: GroupItem = {
      name,
      pos,
      createdAt: new Date(),
      updatedAt: new Date(),
      is_selected: allGroups.length === 0, // Select if it's the first group
    };

    const id = await db.groups.add(newGroup);

    // Refetch groups to ensure correct order
    await set(state => ({
      groups: state.groups.filter(g => g.id !== undefined),
    }));
    const updatedGroups = await db.groups.orderBy('pos').toArray();
    set({ groups: updatedGroups });

    return id;
  },

  updateGroup: async (id, updates) => {
    await db.groups.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    set(state => ({
      groups: state.groups.map(group => (group.id === id ? { ...group, ...updates, updatedAt: new Date() } : group)),
    }));
  },

  deleteGroup: async id => {
    await db.deleteGroup(id);

    set(state => ({
      groups: state.groups.filter(group => group.id !== id),
    }));
  },

  setSelectedGroup: async id => {
    // First, update all groups to be not selected
    await db.transaction('rw', db.groups, async () => {
      await db.groups.toCollection().modify({ is_selected: false });
      await db.groups.update(id, { is_selected: true });
    });

    // Update the state
    set(state => ({
      groups: state.groups.map(group => ({
        ...group,
        is_selected: group.id === id,
      })),
    }));
  },

  reorderGroups: async reorderedGroups => {
    // Update positions in database based on the new order
    await db.transaction('rw', db.groups, async () => {
      for (let i = 0; i < reorderedGroups.length; i++) {
        const group = reorderedGroups[i];
        await db.groups.update(group.id!, {
          pos: i,
          updatedAt: new Date(),
        });
      }
    });

    // Update the state with the new order
    set({
      groups: reorderedGroups.map((group, index) => ({
        ...group,
        pos: index,
        updatedAt: new Date(),
      })),
    });
  },

  // Export groups without id, createdAt, and updatedAt
  exportGroups: async () => {
    const groups = await db.groups.orderBy('pos').toArray();
    return groups.map(({ id, createdAt, updatedAt, ...rest }) => rest);
  },

  // Import groups and return a mapping from group name to group id
  importGroups: async importedGroups => {
    const existingGroups = await db.groups.toArray();
    const nameToIdMap = new Map<string, number>();

    // Create a map of existing group names to their IDs
    existingGroups.forEach(group => {
      if (group.id !== undefined) {
        nameToIdMap.set(group.name, group.id);
      }
    });

    // Find the highest position value
    const maxPos = existingGroups.length > 0 ? Math.max(...existingGroups.map(g => g.pos)) : -1;

    // Process each imported group
    for (let i = 0; i < importedGroups.length; i++) {
      const group = importedGroups[i];

      // If the group already exists, use its ID
      if (nameToIdMap.has(group.name)) {
        continue;
      }

      // Otherwise, create a new group
      const newGroup: GroupItem = {
        name: group.name,
        pos: maxPos + i + 1,
        is_selected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const id = await db.groups.add(newGroup);
      nameToIdMap.set(group.name, id);
    }

    // Refresh the groups in the store
    await get().fetchGroups();

    return nameToIdMap;
  },
});
