import type { DialSlice, ExportedDialItem } from './dial-slice';
import type { GroupSlice } from './group-slice';

import type { GroupItem } from '@src/models';
import { type StateCreator } from 'zustand';

export interface ExportDataType {
  groups: Array<Omit<GroupItem, 'id' | 'createdAt' | 'updatedAt'>>;
  dials: ExportedDialItem[];
}

export interface SharedSlice {
  exportData: () => Promise<void>;
  importData: (data: ExportDataType) => Promise<void>;
}

export const createSharedSlice: StateCreator<BearState, [], [], SharedSlice> = (set, get) => ({
  exportData: async () => {
    // Get access to methods via the complete store
    const store = get();
    const exportedGroups = await store.exportGroups();
    const exportedDials = await store.exportDials();

    const exportData = {
      groups: exportedGroups,
      dials: exportedDials,
    };

    // Create and download the JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `speedial-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  importData: async data => {
    try {
      if (!data || !data.groups || !data.dials) {
        throw new Error('Invalid import data format');
      }

      // Get access to methods via the complete store
      const store = get();

      // First import groups and get the name to ID mapping
      const groupNameToIdMap = await store.importGroups(data.groups);

      // Then import dials using the group mapping
      await store.importDials(data.dials, groupNameToIdMap);

      alert('Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

export interface BearState extends DialSlice, GroupSlice, SharedSlice {}
