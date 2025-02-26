import { type StateCreator } from 'zustand';
import type { DialItem, GroupItem } from '../models';
import { db } from '../models';

export interface DialSlice {
  dials: DialItem[];
  groups: GroupItem[];
  // Actions
  fetchDials: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  addDial: (dial: Omit<DialItem, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateDial: (id: number, updates: Partial<DialItem>) => Promise<void>;
  deleteDial: (id: number) => Promise<void>;
  incrementClickCount: (id: number) => Promise<void>;
  addGroup: (name: string) => Promise<number>;
  updateGroup: (id: number, updates: Partial<GroupItem>) => Promise<void>;
  deleteGroup: (id: number) => Promise<void>;
  setSelectedGroup: (id: number) => Promise<void>;
}

export const createDialSlice: StateCreator<DialSlice> = (set, get) => ({
  dials: [],
  groups: [],

  fetchDials: async () => {
    const dials = await db.dials.toArray();
    set({ dials });
  },

  fetchGroups: async () => {
    const groups = await db.groups.toArray();
    set({ groups });
  },

  addDial: async dialData => {
    const newDial: DialItem = {
      ...dialData,
      clickCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const id = await db.dials.add(newDial);
    const addedDial = await db.dials.get(id);

    if (addedDial) {
      set(state => ({
        dials: [...state.dials, addedDial],
      }));
    }

    return id;
  },

  updateDial: async (id, updates) => {
    await db.dials.update(id, {
      ...updates,
      updatedAt: new Date(),
    });

    set(state => ({
      dials: state.dials.map(dial => (dial.id === id ? { ...dial, ...updates, updatedAt: new Date() } : dial)),
    }));
  },

  deleteDial: async id => {
    await db.dials.delete(id);

    set(state => ({
      dials: state.dials.filter(dial => dial.id !== id),
    }));
  },

  incrementClickCount: async id => {
    const dial = await db.dials.get(id);
    if (dial) {
      const newClickCount = (dial.clickCount || 0) + 1;
      await db.dials.update(id, { clickCount: newClickCount });

      set(state => ({
        dials: state.dials.map(d => (d.id === id ? { ...d, clickCount: newClickCount } : d)),
      }));
    }
  },

  addGroup: async name => {
    // Get the highest order to place the new group at the end
    const groups = await db.groups.toArray();
    const maxPos = groups.length > 0 ? Math.max(...groups.map(g => g.pos)) : -1;

    const newGroup: GroupItem = {
      name,
      pos: maxPos + 1,
      is_selected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
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
});
