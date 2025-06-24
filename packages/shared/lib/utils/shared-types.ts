export type ValueOf<T> = T[keyof T];

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  pathPrefix: string;
};
