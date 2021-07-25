/// <reference types="zx"/>

import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import spinner from "ora";

import { ApplicationProperties } from "../interfaces/types";
import Git from "./git";
import { openBrowser } from "./utils";

interface PullRequestConfig {
  base?: string;
  owner?: string;
  repo?: string;
  title?: string;
}

async function getGithubClient(auth: string): Promise<Octokit> {
  const octokit = new Octokit({
    auth,
  });

  return octokit;
}

class Github {
  private readonly octokit: Octokit;
  private config;
  private ssh: boolean;
  private me: string;
  private owner: string;
  private repo: string;

  constructor(applicationProperties: ApplicationProperties) {
    const {
      config: { config, fromUser, owner, repo },
      octokit,
    } = applicationProperties;
    this.config = config;
    this.octokit = octokit;
    this.ssh = false;
    this.me = config.username;
    this.owner = fromUser || owner || this.me;
    this.repo = repo;
  }

  async listPullRequest(
    showTable: boolean
  ): Promise<RestEndpointMethodTypes["pulls"]["list"]["response"]["data"]> {
    const { owner, repo } = this;

    const spin = spinner(
      `Listing open pull requests on ${chalk.green(`${owner}/${repo}`)}`
    );

    spin.color = "green";
    spin.start();

    const pulls = await this.octokit.rest.pulls.list({
      owner,
      repo,
    });

    if (pulls.data.length) {
      spin.succeed();

      if (showTable) {
        console.table(
          pulls.data.map(({ created_at, number, state, title, user }) => ({
            "#": `#${number}`,
            Author: `@${user?.login}`,
            Opened: created_at,
            Status: state.toUpperCase(),
            Title: title,
          }))
        );
      }
    } else {
      spin.text = "No Pull Request found";
      spin.warn();
    }

    return pulls.data;
  }

  async fetchPullRequest(pull_number: number): Promise<void> {
    const payload = {
      owner: this.owner || this.me,
      pull_number,
      repo: this.repo,
    };

    console.log("Fetching Pull Request");

    const { data } = await this.octokit.rest.pulls.get(payload);

    const newBranch = `${this.config.branch_prefix}${data.number}`;
    const headBranch = data.head.ref;
    const repoUrl = this.ssh
      ? data.head.repo.ssh_url
      : data.head.repo.clone_url;

    await Git.fetch(repoUrl, headBranch, newBranch);

    await this.createComment(data.number);

    await Git.checkout(newBranch);
  }

  async createComment(issue_number: number): Promise<void> {
    const payload = {
      body: this.config.review_signature || "Just starting reviewing :)",
      issue_number,
      owner: this.owner,
      repo: this.repo,
    };

    await this.octokit.issues.createComment(payload);

    console.log(`Added comment: ${chalk.blue(payload.body)}`);
  }

  async openPullRequest(
    title: string,
    actualBranch: string,
    referenceBranch: string
  ): Promise<void> {
    const payload = {
      base: referenceBranch,
      head: `${this.me}:${actualBranch}`,
      owner: this.owner,
      repo: this.repo,
      title,
    };

    try {
      const {
        data: { number },
      } = await this.octokit.rest.pulls.create(payload);

      console.log(
        `Pull Request Sent To: ${chalk.green(`${this.owner}/${this.repo}`)}`
      );

      openBrowser(
        `https://github.com/${this.owner}/${this.repo}/pull/${number}`
      );
    } catch (err) {
      console.log("Error to Send PR", err.message);
    }
  }

  async createPullRequest(pullRequestConfig: PullRequestConfig): Promise<void> {
    const head = await Git.getActualBranch();

    if (!pullRequestConfig.title) {
      pullRequestConfig.title = await Git.getLastCommitMessage();
    }

    if (!pullRequestConfig.repo) {
      pullRequestConfig.repo = this.repo;
    }

    if (!pullRequestConfig.owner) {
      pullRequestConfig.owner = this.owner;
    }

    if (!pullRequestConfig.base) {
      pullRequestConfig.base = await Git.getDefaultBranch();
    }

    const payload = {
      base: pullRequestConfig.base,
      head: `${this.me}:${head}`,
      owner: pullRequestConfig.owner,
      repo: pullRequestConfig.repo,
      title: pullRequestConfig.title,
    };

    console.log({ payload });

    return;

    await Git.push(head);

    try {
      const {
        data: { number },
      } = await this.octokit.rest.pulls.create(payload);

      const delivered_to = `${pullRequestConfig.owner}/${pullRequestConfig.repo}`;

      console.log(`Pull Request Sent To: ${chalk.green(delivered_to)}`);

      openBrowser(`https://github.com/${delivered_to}/pull/${number}`);
    } catch (err) {
      console.log("Error to Send PR", err.message);
    }
  }
}

export { getGithubClient, Github };
