import { type StateCreator } from 'zustand';
import type { GroupItem } from '../models';
import { db } from '../models';

export interface GroupSlice {
  groups: GroupItem[];
  // Actions
  fetchGroups: () => Promise<void>;
  addGroup: (name: string) => Promise<number>;
  updateGroup: (id: number, updates: Partial<GroupItem>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
}

export const createGroupSlice: StateCreator<GroupSlice> = set => ({
  groups: [],

  fetchGroups: async () => {
    const groups = await db.groups.toArray();
    set({ groups });
  },

  addGroup: async name => {
    const newGroup: GroupItem = {
      name,
      pos: 0, // Default order, can be adjusted later
      createdAt: new Date(),
      updatedAt: new Date(),
      is_selected: false,
    };

    const id = await db.groups.add(newGroup);
    const addedGroup = await db.groups.get(id);

    if (addedGroup) {
      set(state => ({
        groups: [...state.groups, addedGroup],
      }));
    }

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
});
