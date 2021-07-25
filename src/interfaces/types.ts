import { Octokit } from "@octokit/rest";
import { ParsedArgs } from "minimist";

interface ApplicationProperties {
  octokit: Octokit;
  config: GithubOptions;
}

interface Configuration {
  username: string;
  review_signature: string;
  token: string;
  branch_prefix: string;
}

interface GithubOptions {
  argv: ParsedArgs;
  config: Configuration;
  fromUser: string;
  owner: string;
  repo: string;
}

export type { Configuration, ApplicationProperties, GithubOptions };
