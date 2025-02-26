import { type StateCreator } from 'zustand';
import type { DialItem } from '../models';
import { db } from '../models';

export interface DialSlice {
  dials: DialItem[];

  // Actions
  fetchDials: () => Promise<void>;
  addDial: (dial: Omit<DialItem, 'id' | 'clickCount' | 'createdAt' | 'updatedAt'>) => Promise<number>;
  updateDial: (id: number, updates: Partial<DialItem>) => Promise<void>;
  deleteDial: (id: number) => Promise<void>;
  incrementClickCount: (id: number) => Promise<void>;
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
});
