export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  pathPrefix: string;
}

export const githubConfig: GitHubConfig = {
  token: '',
  owner: '',
  repo: '',
  pathPrefix: '/',
};
