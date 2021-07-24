/// <reference types="zx"/>

import { Octokit } from "@octokit/rest";
import spinner from "ora";

import { GithubOptions } from "../interfaces/types";
import Git from "./git";
import { openBrowser } from "./utils";

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
  private argv: any;

  constructor(
    octokit: Octokit,
    { argv, config, fromUser, owner, repo }: GithubOptions
  ) {
    this.argv = argv;
    this.config = config;
    this.octokit = octokit;
    this.ssh = false;
    this.me = config.username;
    this.owner = fromUser || owner || this.me;
    this.repo = repo;
  }

  async listPullRequest(): Promise<void> {
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

      console.table(
        pulls.data.map(({ created_at, number, state, title, user }) => ({
          "#": `#${number}`,
          Author: `@${user?.login}`,
          Opened: created_at,
          Status: state.toUpperCase(),
          Title: title,
        }))
      );
    } else {
      spin.text = "No Pull Request found";
      spin.warn();
      // console.log("No Pull Request found");
    }
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

    console.log(`Add comment: ${chalk.blue(payload.body)}`);
  }

  async createPullRequest(): Promise<void> {
    const head = await Git.getActualBranch();
    const title = await Git.getLastCommitMessage();

    console.log(`Sending PR to ${this.owner}`);

    await Git.push(head);

    const payload = {
      base: this.argv.base || "master",
      head: `${this.me}:${head}`,
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
}

export { getGithubClient, Github };
