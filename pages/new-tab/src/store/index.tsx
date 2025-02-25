import { create } from 'zustand';
import { type BearState } from './bear-state';
import { createDialSlice } from './dial-slice';

export const useBearStore = create<BearState>()((...a) => ({
  ...createDialSlice(...a),
}));
