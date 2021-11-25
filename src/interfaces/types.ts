import { Octokit } from "@octokit/rest";

interface ApplicationProperties {
  config: GithubOptions;
  octokit: Octokit;
}

interface BranchFileStats {
  total: string;
  type: string;
}

interface Configuration {
  username: string;
  review_signature: string;
  token: string;
  branch_prefix: string;
  jira_integration: boolean;
  jira_credential: string;
  jira_base64: string;
}

interface GithubOptions {
  config: Configuration;
  owner: string;
  repo: string;
}

export type {
  ApplicationProperties,
  BranchFileStats,
  Configuration,
  GithubOptions,
};
