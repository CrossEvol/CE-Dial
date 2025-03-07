import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  pathPrefix: string;
}

const defaultConfig: GitHubConfig = {
  token: '',
  owner: '',
  repo: '',
  pathPrefix: '/',
};

const storage = createStorage<GitHubConfig>('github-config-storage-key', defaultConfig, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const githubConfigStorage: BaseStorage<GitHubConfig> = {
  ...storage,
};
