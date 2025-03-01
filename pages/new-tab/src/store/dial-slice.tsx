import { type StateCreator } from 'zustand';
import type { DialItem } from '../models';
import { db } from '../models';

// Define a type for exported dial items
export interface ExportedDialItem extends Omit<DialItem, 'id' | 'groupId' | 'createdAt' | 'updatedAt'> {
  group_name: string;
}

export interface DialSlice {
  dials: DialItem[];

  // Actions
  fetchDials: () => Promise<void>;
  addDial: (dial: Omit<DialItem, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateDial: (id: number, updates: Partial<DialItem>) => Promise<void>;
  deleteDial: (id: number) => Promise<void>;
  incrementClickCount: (id: number) => Promise<void>;
  reorderDials: (reorderedDials: DialItem[]) => Promise<void>;

  // Export/Import related
  exportDials: () => Promise<ExportedDialItem[]>;
  importDials: (dials: ExportedDialItem[], groupNameToIdMap: Map<string, number>) => Promise<void>;
}

export const createDialSlice: StateCreator<DialSlice> = (set, get) => ({
  dials: [],

  fetchDials: async () => {
    const dials = await db.dials.toArray();
    set({ dials });
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

  reorderDials: async reorderedDials => {
    await db.transaction('rw', db.dials, async () => {
      for (let i = 0; i < reorderedDials.length; i++) {
        const dial = reorderedDials[i];
        await db.dials.update(dial.id!, {
          pos: i,
          updatedAt: new Date(),
        });
      }
    });

    // Update only the affected dials while preserving others
    set(state => {
      const updatedDialsMap = new Map();
      reorderedDials.forEach((dial, index) => {
        updatedDialsMap.set(dial.id, {
          ...dial,
          pos: index,
          updatedAt: new Date(),
        });
      });

      // Merge the updated dials with existing dials from other groups
      return {
        dials: state.dials.map(dial => (updatedDialsMap.has(dial.id) ? updatedDialsMap.get(dial.id) : dial)),
      };
    });
  },

  // Export dials with group_name instead of groupId
  exportDials: async () => {
    const dials = await db.dials.toArray();
    const groups = await db.groups.toArray();

    // Create a map of group IDs to group names
    const groupIdToName = new Map<number, string>();
    groups.forEach(group => {
      if (group.id !== undefined) {
        groupIdToName.set(group.id, group.name);
      }
    });

    // Transform dials for export
    return dials.map(({ id, groupId, createdAt, updatedAt, ...rest }) => ({
      ...rest,
      group_name: groupIdToName.get(groupId) || 'Unknown Group',
    }));
  },

  // Import dials using the group name to ID mapping
  importDials: async (importedDials, groupNameToIdMap) => {
    const existingDials = await db.dials.toArray();

    // Find the highest position value for each group
    const groupMaxPos = new Map<number, number>();
    existingDials.forEach(dial => {
      const currentMax = groupMaxPos.get(dial.groupId) || -1;
      if (dial.pos > currentMax) {
        groupMaxPos.set(dial.groupId, dial.pos);
      }
    });

    // Process each imported dial
    for (const dial of importedDials) {
      const { group_name, ...dialData } = dial;

      // Get the group ID for this dial
      const groupId = groupNameToIdMap.get(group_name);
      if (!groupId) {
        console.warn(`Group "${group_name}" not found for dial "${dial.title}"`);
        continue;
      }

      // Determine the position for this dial
      const pos = (groupMaxPos.get(groupId) || -1) + 1;
      groupMaxPos.set(groupId, pos);

      // Create the new dial
      const newDial: DialItem = {
        ...dialData,
        groupId,
        pos,
        clickCount: dial.clickCount || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.dials.add(newDial);
    }

    // Refresh the dials in the store
    await get().fetchDials();
  },
});
