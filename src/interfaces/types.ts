import { ParsedArgs } from "minimist";

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

export type { Configuration, GithubOptions };
