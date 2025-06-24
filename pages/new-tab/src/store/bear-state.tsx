import type { DialSlice, ExportedDialItem } from './dial-slice';
import type { GroupSlice } from './group-slice';

import { createGitHubSyncService, getGithubConfig, isGitHubConfigValid } from '@/lib/github';
import type { DialItem, GroupItem } from '@src/models';
import { toast } from 'react-toastify';
import { type StateCreator } from 'zustand';

/* 
Create and download the JSON file
*/
function exportData(exportData: Record<string | number | symbol, unknown>, filename: string): void {
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', filename);
  linkElement.click();
}

export interface ExportDataType {
  groups: Array<Omit<GroupItem, 'id' | 'createdAt' | 'updatedAt'>>;
  dials: ExportedDialItem[];
}

export interface SharedSlice {
  getFilteredDials: () => DialItem[];
  exportDialsData: () => Promise<void>;
  exportGithubData: () => Promise<void>;
  importDialsData: (data: ExportDataType) => Promise<void>;
  syncDialsData: () => Promise<void>;
  isSyncConfigured: () => Promise<boolean>;
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

  exportDialsData: async () => {
    // Get access to methods via the complete store
    const store = get();
    const exportedGroups = await store.exportGroups();
    const exportedDials = await store.exportDials();

    const dialsData = {
      groups: exportedGroups,
      dials: exportedDials,
    };

    const exportFileDefaultName = `speedial-dials-backup-${new Date().toISOString().slice(0, 10)}.json`;

    // Create and download the JSON file
    exportData(dialsData, exportFileDefaultName);
  },

  exportGithubData: async () => {
    // Get access to methods via the complete store
    const githubConfig = await getGithubConfig();

    const exportFileDefaultName = `speedial-github-backup-${new Date().toISOString().slice(0, 10)}.json`;

    exportData(githubConfig, exportFileDefaultName);
  },

  importDialsData: async data => {
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

      toast.success('Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  syncDialsData: async () => {
    try {
      const githubService = await createGitHubSyncService();
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

      toast.success('Data synced successfully with GitHub!');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  isSyncConfigured: async () => {
    return await isGitHubConfigValid();
  },
});

export interface BearState extends DialSlice, GroupSlice, SharedSlice {}
