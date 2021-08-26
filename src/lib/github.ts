import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import Table from "cli-table3";
import open from "open";
import spinner from "ora";

import { ApplicationProperties } from "../interfaces/types";
import Git from "./git";
import { getTimeFromNow } from "./utils";

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
  ): Promise<
    RestEndpointMethodTypes["pulls"]["list"]["response"]["data"] | undefined
  > {
    const { owner, repo } = this;

    const spin = spinner(
      `Listing open pull requests on ${chalk.green(`${owner}/${repo}`)}`
    );

    spin.color = "green";
    spin.start();

    try {
      const pulls = await this.octokit.rest.pulls.list({
        owner,
        repo,
      });

      if (pulls.data.length) {
        spin.succeed();

        if (showTable) {
          const table = new Table({
            head: ["#", "Author", "Opened", "Status", "Title"],
            style: { head: ["cyan"] },
          });

          pulls.data.forEach(({ created_at, number, state, title, user }) => {
            table.push([
              `#${number}`,
              `@${user?.login}`,
              getTimeFromNow(created_at),
              state.toUpperCase(),
              title,
            ]);
          });

          console.log(table.toString());
        }

        return pulls.data;
      } else {
        spin.text = "No Pull Request found";
        spin.warn();
      }
    } catch (error) {
      spin.text = error.message;
      spin.fail();
    }
  }

  async fetchPullRequest(
    pull_number: number,
    comment?: string | boolean | undefined
  ): Promise<void> {
    const payload = {
      owner: this.owner || this.me,
      pull_number,
      repo: this.repo,
    };

    console.log(
      `Fetching Pull Requests on ${chalk.green(
        `${payload.owner}/${payload.repo}`
      )}`
    );

    try {
      const { data } = await this.octokit.rest.pulls.get(payload);

      const newBranch = `${this.config.branch_prefix}${data.number}`;
      const headBranch = data.head.ref;
      const repoUrl = this.ssh
        ? data?.head?.repo?.ssh_url
        : data?.head?.repo?.clone_url;

      await Git.fetch(repoUrl || "", headBranch, newBranch);

      if (typeof comment !== "boolean") {
        await this.createComment(comment, data.number);
      }

      await Git.checkout(newBranch);
    } catch (error) {
      console.log("Error to Pull Request", error.message);
    }
  }

  async createComment(
    comment: string | undefined,
    issue_number: number
  ): Promise<void> {
    const payload = {
      body:
        comment || this.config.review_signature || "Just starting reviewing :)",
      issue_number,
      owner: this.owner,
      repo: this.repo,
    };

    await this.octokit.issues.createComment(payload);

    console.log(`Added comment: ${chalk.blue(payload.body)}`);
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

    const spin = spinner(
      `Creating Pull Request to ${chalk.green(
        `${payload.owner}/${payload.repo}`
      )}`
    );

    spin.color = "green";
    spin.start();

    await Git.push(head);

    try {
      const {
        data: { number },
      } = await this.octokit.rest.pulls.create(payload);

      const delivered_to = `${pullRequestConfig.owner}/${pullRequestConfig.repo}`;

      spin.text = `Pull Request Sent to: ${chalk.green(delivered_to)}`;
      spin.succeed();

      await open(`https://github.com/${delivered_to}/pull/${number}`);
    } catch (err) {
      spin.text = `Error to Send PR: ${chalk.green(err.message)}`;
      spin.warn();
    }
  }
}

export { getGithubClient, Github };
