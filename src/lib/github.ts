import { Octokit, RestEndpointMethodTypes } from "@octokit/rest";
import Table from "cli-table3";
import open from "open";
import spinner from "ora";

import { ApplicationProperties } from "../interfaces/types";
import Git from "./git";
import { getTimeFromNow } from "./utils";

interface Options {
  base?: string;
  owner?: string;
  prefix?: string;
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
  private readonly config;
  private readonly ssh: boolean;
  private readonly me: string;
  private readonly owner: string;
  private readonly repo: string;

  constructor(applicationProperties: ApplicationProperties) {
    const {
      config: { config, owner, repo },
      octokit,
    } = applicationProperties;
    this.config = config;
    this.octokit = octokit;
    this.ssh = false;
    this.me = config.username || "";
    this.owner = owner || this.me;
    this.repo = repo || "";
  }

  private getReferenceOptions(options: Options = {}): Options {
    if (!options.repo) {
      options.repo = this.repo;
    }

    if (!options.owner) {
      options.owner = this.owner;
    }

    if (!options.prefix) {
      options.prefix = this.config.branch_prefix;
    }

    return options;
  }

  async listPullRequest(
    showTable: boolean,
    options?: Options
  ): Promise<
    RestEndpointMethodTypes["pulls"]["list"]["response"]["data"] | undefined
  > {
    const _options = this.getReferenceOptions(options);

    const spin = spinner(
      `Listing open pull requests on ${chalk.green(
        `${_options.owner}/${_options.repo}`
      )}`
    );

    spin.color = "green";
    spin.start();

    try {
      const pulls = await this.octokit.rest.pulls.list({
        owner: _options.owner as string,
        repo: _options.repo as string,
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
      spin.text = `Error: ${error.message} - ${chalk.green(
        `${_options.owner}/${_options.repo}`
      )}`;
      spin.fail();
    }
    return [];
  }

  async fetchPullRequest(
    pull_number: number,
    comment?: string | boolean | undefined,
    options?: Options
  ): Promise<boolean> {
    const _options = this.getReferenceOptions(options);

    const payload = {
      owner: _options.owner as string,
      pull_number,
      repo: _options.repo as string,
    };

    console.log(
      `Fetching Pull Requests on ${chalk.green(
        `${payload.owner}/${payload.repo}`
      )}`
    );

    try {
      const { data } = await this.octokit.rest.pulls.get(payload);

      const newBranch = `${_options.prefix}${data.number}`;
      const headBranch = data.head.ref;
      const repoUrl = this.ssh
        ? data?.head?.repo?.ssh_url
        : data?.head?.repo?.clone_url;

      await Git.fetch(repoUrl || "", headBranch, newBranch);

      if (typeof comment !== "boolean") {
        await this.createComment(comment, data.number, {
          owner: payload.owner,
        });
      }

      await Git.checkout(newBranch);

      return true;
    } catch (error) {
      console.log("Error to Pull Request", error.message);

      return false;
    }
  }

  async forwardPullRequest(
    pull_number: number,
    owner: string,
    forwardTo: string
  ): Promise<void> {
    console.log("Starting Forward Pull Request");

    const fetchWorked = await this.fetchPullRequest(pull_number, false, {
      owner,
      prefix: `rand-${new Date().getTime()}`,
    });

    if (fetchWorked) {
      const forwarded_pr = await this.createPullRequest({
        owner: forwardTo,
      });

      await this.createComment(
        `Pull Request forwarded: ${forwarded_pr?.html_url}`,
        pull_number,
        { owner }
      );
    }
  }

  async createComment(
    comment: string | undefined,
    issue_number: number,
    options?: Options,
    with_log = true
  ): Promise<void> {
    const _options = this.getReferenceOptions(options);

    const payload = {
      body:
        comment || this.config.review_signature || "Just starting reviewing :)",
      issue_number,
      owner: _options.owner as string,
      repo: _options.repo as string,
    };

    await this.octokit.issues.createComment(payload);

    if (with_log) {
      console.log(`Added comment: ${chalk.blue(payload.body)}`);
    }
  }

  async createPullRequest(
    options: Options
  ): Promise<
    RestEndpointMethodTypes["pulls"]["create"]["response"]["data"] | undefined
  > {
    const head = await Git.getCurrentBranch();

    const _options = this.getReferenceOptions(options);

    if (!_options.title) {
      _options.title = await Git.getLastCommitMessage();
    }

    if (!_options.base) {
      _options.base = await Git.getDefaultBranch();
    }

    const payload = {
      base: _options.base,
      head: `${this.me}:${head}`,
      owner: _options.owner as string,
      repo: _options.repo as string,
      title: _options.title,
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
      const { data } = await this.octokit.rest.pulls.create(payload);

      const delivered_to = `${_options.owner}/${_options.repo}`;

      spin.text = `Pull Request Sent to: ${chalk.green(delivered_to)}`;
      spin.succeed();

      await open(`https://github.com/${delivered_to}/pull/${data.number}`);

      return data;
    } catch (err) {
      spin.text = `Error to Send PR: ${chalk.green(err.message)}`;
      spin.warn();

      return undefined;
    }
  }
}

export { getGithubClient, Github };
