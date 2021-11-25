import spinner from "ora";

import { ApplicationProperties } from "../interfaces/types";
import { saveProjectConfig } from "./credentials";
import { Git } from "./git";
import { Github } from "./github";
import { Report } from "./report";
import { prompts } from "./utils";

export class Commands {
  public applicationProperties: ApplicationProperties;
  public git: Git;
  public github: Github;
  public report: Report;

  constructor(applicationProperties: ApplicationProperties) {
    this.applicationProperties = applicationProperties;
    this.git = new Git();
    this.github = new Github(applicationProperties);
    this.report = new Report(applicationProperties);
  }

  private logShortcut(command: string): void {
    const alias = "gitray";

    console.info(
      `To repeat this command, easily, use this shorthand: ${chalk.cyan(
        `${alias} ${command}`
      )}`
    );
  }

  private async getPullRequestId(data: any[]): Promise<number> {
    const list_pr_answer = await prompts([
      {
        choices: [
          ...data.map(({ number, title }) => ({
            title: `#${number}: ${title}`,
            value: number,
          })),
          {
            title: "I want to insert Pull Request ID",
            value: "request-id",
          },
        ],
        initial: 0,
        message: "Do you want to get someone of these Pull Requests?",
        name: "pull_request_id_1",
        type: "select",
      },
      {
        message: "Pull Request ID",
        name: "pull_request_id_2",
        type: (prev) => (prev === "request-id" ? "number" : null),
      },
    ]);

    const pull_request_id = list_pr_answer.pull_request_id_2
      ? list_pr_answer.pull_request_id_2
      : list_pr_answer.pull_request_id_1;

    return pull_request_id;
  }

  public async workflowForFetchDry(): Promise<void> {
    console.log("wow");
  }

  public async workflowForFetchOnboard(): Promise<void> {
    const origins = await this.git.getOrigins();

    const { remoteName } = await prompts({
      choices: [
        ...origins
          .sort((a, b) => a.alias.localeCompare(b.alias))
          .map((origin) => ({
            title: `${origin.name} ${
              origin.name !== origin.alias ? `(${origin.alias})` : ""
            }`,
            value: origin.alias,
          })),
        {
          title: "Add New Remote",
          value: "other",
        },
      ],
      message: "Do you want to fetch from",
      name: "remoteName",
      type: "autocomplete",
    });

    const branches = await this.git.getBranchesFromRemote(remoteName);

    const { branch } = await prompts({
      choices: branches.map((branch) => ({
        title: branch.replace("refs/heads/", ""),
      })),
      message: `Pick the Branch from ${remoteName}:`,
      name: "branch",
      type: "autocomplete",
    });

    const newBranch = `${branch}-${new Date().getTime()}`;

    const spin = spinner(`Fetching Branch ${branch} from ${remoteName}`);

    spin.start();

    const branchExist = await this.git.verifyBranchExistLocal(newBranch);

    if (branchExist) {
    } else {
      await this.git.fetch(remoteName, branch, newBranch);

      spin.text = `Checkout into branch ${newBranch}`;

      await this.git.checkout(newBranch);
    }

    spin.succeed();
  }

  public async workflowForPullRequestDry(
    cmd: any,
    args: string[]
  ): Promise<void> {
    const { base, comment, forward, send, title, user } = cmd;

    const arg0 = args[0];

    if (forward) {
      if (!arg0) {
        console.error(
          `Example of Forward: ${chalk.cyan(
            "gh pr -u liferay pt-liferay-solutions 123"
          )}`
        );
        return console.error(`Exiting: ${chalk.red("Commands Missing")}`);
      }

      await this.github.forwardPullRequest(
        parseInt(arg0, 10), // Pull Request ID
        user, // Owner
        forward // Forward To
      );

      return;
    }

    if (arg0) {
      await this.github.fetchPullRequest(Number(arg0), comment, {
        owner: user,
      });
    } else if (send) {
      const payload = {
        base,
        owner: send,
        repo: user,
        title,
      };

      const created_pull_request = await this.github.createPullRequest(payload);

      if (created_pull_request) {
        const report = await this.report.createReport();

        if (report && created_pull_request?.number) {
          await this.github.createComment(
            report,
            created_pull_request.number,
            payload,
            false
          );
        }
      }
    } else {
      await this.github.listPullRequest(true, { owner: user });
    }
  }

  public async workflowForPullRequestOnboard(): Promise<void> {
    const response = await prompts({
      choices: [
        {
          description:
            "Forward one specific Pull Request from someone to other user",
          title: "Forward",
          value: "forward-pr",
        },
        {
          description: "Get one specific Pull Request from someone",
          title: "Get",
          value: "get-pr",
        },
        {
          description: "List Pull Requests from someone",
          title: "List",
          value: "list-pr",
        },
        {
          description: "Send Pull Request to someone",
          title: "Send",
          value: "send-pr",
        },
      ],
      initial: 0,
      message: "Which Command do you want to perform for Pull Request?",
      name: "value",
      type: "select",
    });

    switch (response.value) {
      case "get-pr": {
        const { pull_request_id } = await prompts({
          message: "Insert the Pull Request ID",
          name: "pull_request_id",
          type: "number",
        });

        this.github.fetchPullRequest(pull_request_id);

        this.logShortcut(
          `pr -u ${this.applicationProperties.config.owner} ${pull_request_id}`
        );

        break;
      }

      case "forward-pr": {
        const { forward_pr_from } = await prompts({
          message: "Do you want to forward PR from which github user ?",
          name: "forward_pr_from",
          type: "text",
        });

        const data = await this.github.listPullRequest(true, {
          owner: forward_pr_from,
        });

        if (data && data.length) {
          const { confirm_select_pr } = await prompts({
            initial: false,
            message: "Do you want to select one of these PRs ?",
            name: "confirm_select_pr",
            type: "confirm",
          });

          if (confirm_select_pr) {
            const pull_request_id = await this.getPullRequestId(data);

            const { forward_pr_to } = await prompts({
              message: "Do you want to forward PR to who?",
              name: "forward_pr_to",
              type: "text",
            });

            await this.github.forwardPullRequest(
              pull_request_id,
              forward_pr_from,
              forward_pr_to
            );

            this.logShortcut(
              `pr forward -u ${forward_pr_from} ${forward_pr_to} ${pull_request_id}`
            );
          }
        }

        break;
      }

      case "list-pr": {
        const { confirm_list_my_prs } = await prompts({
          initial: true,
          message: "I Want to List my Pull Request or from someone else ?",
          name: "confirm_list_my_prs",
          type: "confirm",
        });

        let list_pr_from = this.applicationProperties.config.owner;

        if (!confirm_list_my_prs) {
          ({ list_pr_from } = await prompts({
            message:
              "Do you want to list Pull Request from which github user ?",
            name: "list_pr_from",
            type: "text",
          }));
        }

        const data = await this.github.listPullRequest(true, {
          owner: list_pr_from,
        });

        if (data) {
          const { confirm_select_pr } = await prompts({
            initial: true,
            message: data.length
              ? "Do you want to select one of these PRs ?"
              : "No Pull Request open was found, but you can type Pull Request ID",
            name: "confirm_select_pr",
            type: "confirm",
          });

          this.logShortcut(`pr -u ${list_pr_from}`);

          if (confirm_select_pr) {
            const pull_request_id = await this.getPullRequestId(data);

            await this.github.fetchPullRequest(pull_request_id, undefined, {
              owner: list_pr_from,
            });

            this.logShortcut(`pr -u ${list_pr_from} ${pull_request_id}`);
          }
        }

        break;
      }

      case "send-pr": {
        const [origins, defaultBranch] = await Promise.all([
          this.git.getOrigins(),
          this.git.getDefaultBranch(),
        ]);

        const repo = this.applicationProperties.config.repo;
        const myConfig = this.applicationProperties.config.config as any;
        const projectConfig = myConfig[repo];

        if (projectConfig) {
          const configOrigins = projectConfig.remotes?.map(
            (origin: string | { alias: string; name: string }) => {
              if (typeof origin === "string") {
                return {
                  alias: origin,
                  name: origin,
                };
              } else {
                return origin;
              }
            }
          );

          for (const origin of [...configOrigins, origins]) {
            if (!origins.find(({ name }) => name === origin.name))
              origins.concat(origin);
          }
        }

        const last_commit = await this.git.getLastCommitMessage();

        const response = await prompts([
          {
            choices: [
              ...origins
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((origin) => ({
                  title: origin.name,
                  value: origin.name,
                })),
              {
                title: "Other",
                value: "other",
              },
            ],
            message: "Do you want to send this PR to:",
            name: "send_pr_to",
            type: "autocomplete",
          },
          {
            message: "Insert the Github Username",
            name: "username",
            type: (prev: string) => (prev === "other" ? "text" : null),
          },
          {
            initial: defaultBranch,
            message: "Which Branch do you want to send ?",
            name: "reference_branch",
            type: "text",
          },
          {
            initial: repo,
            message: "Which Repository do you want to send ?",
            name: "reference_repository",
            type: "text",
          },
          {
            initial: last_commit,
            message: "Insert the Pull Request Title",
            name: "title",
            type: "text",
          },
        ]);

        const isOtherUser = response.send_pr_to === "other";

        const username = isOtherUser ? response.username : response.send_pr_to;

        if (isOtherUser) {
          await saveProjectConfig(repo, username, origins);
        }

        const { confirm_send_pr } = await prompts({
          initial: true,
          message: "Do you want to send the Pull Request ?",
          name: "confirm_send_pr",
          type: "confirm",
        });

        if (!confirm_send_pr) {
          return console.log("Pull Request not Sent");
        }

        const payload = {
          base: response.reference_branch,
          owner: username,
          repo: response.reference_repository,
          title: response.title,
        };

        const created_pull_request = await this.github.createPullRequest(
          payload
        );

        if (created_pull_request) {
          const report = await this.report.createReport();

          if (report && created_pull_request?.number) {
            await this.github.createComment(
              report,
              created_pull_request.number,
              payload,
              false
            );
          }
        }

        this.logShortcut(`pr -s ${username}`);

        break;
      }
    }
  }
}
