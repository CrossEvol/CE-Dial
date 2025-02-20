import { create } from 'zustand';
import { type BearState } from './bear-state';
import { createTaskSlice } from './task-slice';

export const useBearStore = create<BearState>()((...a) => ({
  ...createTaskSlice(...a),
}));
