import type { DialSlice, ExportedDialItem } from './dial-slice';
import type { GroupSlice } from './group-slice';

import { createGitHubSyncService, isGitHubConfigValid } from '@/lib/github';
import type { DialItem, GroupItem } from '@src/models';
import { type StateCreator } from 'zustand';

export interface ExportDataType {
  groups: Array<Omit<GroupItem, 'id' | 'createdAt' | 'updatedAt'>>;
  dials: ExportedDialItem[];
}

export interface SharedSlice {
  getFilteredDials: () => DialItem[];
  exportData: () => Promise<void>;
  importData: (data: ExportDataType) => Promise<void>;
  syncData: () => Promise<void>;
  isSyncConfigured: () => boolean;
}

export const createSharedSlice: StateCreator<BearState, [], [], SharedSlice> = (set, get) => ({
  getFilteredDials: () => {
    const { groups, dials } = get();
    const selectedGroupId = groups.find(group => group.is_selected)?.id;

    const filteredDials = selectedGroupId ? dials.filter(dial => dial.groupId === selectedGroupId) : dials;

    return [...filteredDials].sort((a, b) => {
      const posA = a.pos ?? Number.MAX_SAFE_INTEGER;
      const posB = b.pos ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
  },

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

  syncData: async () => {
    try {
      const githubService = createGitHubSyncService();
      console.log('create github service successfully.');
      console.log(githubService);
      if (!githubService) {
        throw new Error('GitHub sync is not configured properly');
      }

      // Get access to methods via the complete store
      const store = get();
      const exportedGroups = await store.exportGroups();
      const exportedDials = await store.exportDials();

      const exportData = {
        groups: exportedGroups,
        dials: exportedDials,
        lastSynced: new Date().toISOString(),
      };

      console.log('data sync to github is :');
      console.log(exportData);

      // Upload to GitHub
      const filename = 'speed-dial-data.json';
      await githubService.uploadData(filename, exportData);

      // Try to download and merge (for future implementation)
      try {
        // const remoteData = await githubService.downloadData(filename);
        // console.log('Remote data retrieved successfully:', remoteData);
        console.log('Remote data retrieved successfully:');
        // In the future, you could implement merging logic here
      } catch (downloadError) {
        console.warn('Could not retrieve remote data, but upload succeeded:', downloadError);
      }

      alert('Data synced successfully with GitHub!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  isSyncConfigured: () => {
    return isGitHubConfigValid();
  },
});

export interface BearState extends DialSlice, GroupSlice, SharedSlice {}
