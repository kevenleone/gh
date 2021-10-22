import { Octokit } from "@octokit/rest";

interface ApplicationProperties {
  config: GithubOptions;
  octokit: Octokit;
}

interface Configuration {
  username: string;
  review_signature: string;
  token: string;
  branch_prefix: string;
}

interface GithubOptions {
  config: Configuration;
  owner: string;
  repo: string;
}

export type { Configuration, ApplicationProperties, GithubOptions };
