import { Octokit } from 'octokit';
import type { GitHubConfig } from './github.config';
import { githubConfig } from './github.config';

export const isGitHubConfigValid = (): boolean => {
  return !!(githubConfig.token && githubConfig.owner && githubConfig.repo);
};

export class GitHubSyncService {
  private octokit: Octokit;

  constructor(private config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  async uploadData(filename: string, data: unknown): Promise<void> {
    try {
      // const path = `${this.config.pathPrefix}${filename}`;
      const path = filename;

      // Browser-compatible base64 encoding
      const jsonString = JSON.stringify(data, null, 2);
      const content = btoa(unescape(encodeURIComponent(jsonString)));
      console.log('content = ', content);

      const { data: resp } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });
      //@ts-expect-error the response is a union type, which is difficult to extract, but it indeed has sha field
      const sha = resp.sha;

      // Create or update file
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message: `Update ${filename} - ${new Date().toISOString()}`,
        content,
        sha,
        committer: {
          name: 'Speed Dial Sync',
          email: 'octocat@github.com',
        },
        author: {
          name: 'Speed Dial Sync',
          email: 'octocat@github.com',
        },
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
    } catch (error) {
      console.error('GitHub sync error:', error);
      throw new Error(`Failed to sync with GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadData(filename: string): Promise<unknown> {
    try {
      // const path = `${this.config.pathPrefix}${filename}`;
      const path = filename;

      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
      });

      if (Array.isArray(data)) {
        throw new Error('Expected file but got directory');
      }

      // Fix: data.content contains the base64 encoded content, not data.url
      //@ts-expect-error the response is a union type, which is difficult to extract, but it indeed has content field
      const content = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(content);
    } catch (error) {
      console.error('GitHub download error:', error);
      throw new Error(`Failed to download from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createGitHubSyncService = (): GitHubSyncService | null => {
  if (!isGitHubConfigValid()) {
    return null;
  }
  return new GitHubSyncService(githubConfig);
};
