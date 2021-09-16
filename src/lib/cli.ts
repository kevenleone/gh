import spinner from "ora";

import { ApplicationProperties } from "../interfaces/types";
import { askConfiguration, saveProjectConfig } from "./credentials";
import { Git } from "./git";
import { Github } from "./github";
import { buildFlags, prompts } from "./utils";

class CommandLine {
  private applicationProperties: ApplicationProperties;
  private git: Git;
  public github: Github;

  constructor(applicationProperties: ApplicationProperties) {
    this.applicationProperties = applicationProperties;
    this.git = new Git();
    this.github = new Github(applicationProperties);
  }

  private logShortcut(command: string): void {
    console.info(
      `To repeat this command, easily, use this shorthand: ${chalk.cyan(
        command
      )}`
    );
  }

  private async workflowForFetchDry(): Promise<void> {
    console.log("wow");
  }

  private async workflowForFetchOnboard(): Promise<void> {
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

    const newBranch = `${branch}-new`;

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

  private async workflowForPullRequestDry(): Promise<void> {
    const {
      base,
      user: repo,
      comment,
      title,
      sendTo,
      _: [, secondCommand],
    } = buildFlags(
      this.applicationProperties.config.argv,
      "base",
      "comment",
      "title",
      "user",
      "sendTo"
    );

    if (secondCommand) {
      return this.github.fetchPullRequest(Number(secondCommand), comment);
    }

    if (sendTo) {
      return this.github.createPullRequest({ base, repo, title });
    }

    await this.github.listPullRequest(true);
  }

  private async workflowForPullRequestOnboard(): Promise<void> {
    const response = await prompts({
      choices: [
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

        this.logShortcut("gt pr -u username 111");

        break;
      }

      case "list-pr": {
        const data = await this.github.listPullRequest(true);

        if (data && data.length) {
          const { confirm_select_pr } = await prompts({
            initial: false,
            message: "Do you want to select one of these PRs ?",
            name: "confirm_select_pr",
            type: "confirm",
          });

          this.logShortcut("gt pr -u username");

          if (confirm_select_pr) {
            const list_pr_answer = await prompts([
              {
                choices: [
                  ...data.map(({ number, title }) => ({
                    title: `#${number}: ${title}`,
                    value: number,
                  })),
                  {
                    title: "I want to insert the Pull Request ID",
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

            this.github.fetchPullRequest(pull_request_id);

            this.logShortcut(`gt pr -u ${pull_request_id}`);
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

        if (confirm_send_pr) {
          await this.github.createPullRequest({
            base: response.reference_branch,
            owner: username,
            repo: response.reference_repository,
            title: response.title,
          });

          this.logShortcut(`gt pr -s ${username}`);
        } else {
          console.log("PR not Sent");
        }

        break;
      }
    }
  }

  private async execWorkflow(
    withOnboardWorkflow: boolean,
    workflowDry: () => Promise<void>,
    workflowOnboard: () => Promise<void>
  ) {
    if (withOnboardWorkflow) {
      await workflowOnboard();
    } else {
      await workflowDry();
    }
  }

  /**
   * @description Show the Application options and actions, you may see a guided tour,
   * calling the application without arguments
   *
   * Some commands has the name Dry for no interface
   * and Onboard for Guided use
   */

  public async showCommands(): Promise<void> {
    const [mainCommand] = this.applicationProperties.config.argv._;

    const withOnboardWorkflow = !mainCommand;

    let action: string = mainCommand;

    if (withOnboardWorkflow) {
      const response = await prompts({
        choices: [
          { title: "Configuration", value: "config" },
          {
            description: "This option has a description",
            title: "Pull Request",
            value: "pr",
          },
          { title: "Sync", value: "sync" },
          { disabled: false, title: "Fetch", value: "fetch" },
          { disabled: true, title: "Issues", value: "issues" },
        ],
        initial: 0,
        message: "Which Action do you want to perform?",
        name: "value",
        type: "select",
      });

      action = response.value;
    }

    switch (action) {
      case "pr": {
        await this.execWorkflow(
          withOnboardWorkflow,
          this.workflowForPullRequestDry.bind(this),
          this.workflowForPullRequestOnboard.bind(this)
        );
        break;
      }

      case "fetch": {
        await this.execWorkflow(
          withOnboardWorkflow,
          this.workflowForFetchDry.bind(this),
          this.workflowForFetchOnboard.bind(this)
        );

        break;
      }

      case "issues": {
        console.log("Issues");

        break;
      }

      case "config": {
        await askConfiguration(this.applicationProperties.config.config);

        break;
      }

      case "sync": {
        console.log("Sync");
        break;
      }

      default: {
        console.log("Byee");
        break;
      }
    }
  }
}

export default CommandLine;
