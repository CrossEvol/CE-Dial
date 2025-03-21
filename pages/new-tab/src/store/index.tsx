import { create } from 'zustand';
import { createSharedSlice, type BearState } from './bear-state';
import { createDialSlice } from './dial-slice';
import { createGroupSlice } from './group-slice';

export const useBearStore = create<BearState>()((...a) => ({
  ...createDialSlice(...a),
  ...createGroupSlice(...a),
  ...createSharedSlice(...a),
}));
