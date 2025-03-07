export type ValueOf<T> = T[keyof T];

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  pathPrefix: string;
}
