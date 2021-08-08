import prompts from "prompts";

import { ApplicationProperties } from "../interfaces/types";
import { askConfiguration, saveProjectConfig } from "./credentials";
import { Git } from "./git";
import { Github } from "./github";
import { promptConfig } from "./utils";

class CommandLine {
  private applicationProperties: ApplicationProperties;
  private commandsList: any;
  private git: Git;
  public github: Github;

  constructor(applicationProperties: ApplicationProperties) {
    this.applicationProperties = applicationProperties;
    this.commandsList = {
      get_pull_request_id: {
        initial: 0,
        message: "Do you want to get someone of these Pull Requests?",
        name: "pull_request_id_1",
        type: "select",
      },
      insert_pull_request_id: {
        message: "Insert the Pull Request ID",
        name: "pull_request_id",
        type: "number",
      },
      onboard: {
        choices: [
          { title: "Configuration", value: "config" },
          { title: "Fetch", value: "fetch" },
          { title: "Issues", value: "issues" },
          {
            description: "This option has a description",
            title: "Pull Request",
            value: "pr",
          },
          { title: "Sync", value: "sync" },
        ],
        initial: 0,
        message: "Which Action do you want to perform?",
        name: "value",
        type: "select",
      },
      pull_request: {
        list_pr: {
          confirm_to_select_pr: {
            initial: false,
            message: "Do you want to select one of these PRs ?",
            name: "confirm_select_pr",
            type: "confirm",
          },
        },
        send_pr: {
          confirm: {
            initial: true,
            message: "Do you want to send the Pull Request ?",
            name: "confirm_send_pr",
            type: "confirm",
          },
          get_title: {
            message: "Insert the Pull Request Title",
            name: "title",
            type: "text",
          },
          other_user: {
            message: "Insert the Github Username",
            name: "username",
            type: (prev: string) => (prev === "other" ? "text" : null),
          },
          reference_branch: {
            initial: "master",
            message: "Which Branch do you want to send ?",
            name: "reference_branch",
            type: "text",
          },
          reference_repository: {
            message: "Which Repository do you want to send ?",
            name: "reference_repository",
            type: "text",
          },
          to: {
            choices: [
              { title: "Cage" },
              { title: "Clooney", value: "silver-fox" },
              { title: "Gyllenhaal" },
              { title: "Gibson" },
              { title: "Grant" },
            ],
            message: "Do you want to send this PR to:",
            name: "send_pr_to",
            type: "autocomplete",
          },
        },
      },
      pull_request_options: {
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
      },
    };
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

    const { remoteName } = await prompts(
      {
        ...this.commandsList.pull_request.send_pr.to,
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
      },
      promptConfig
    );

    const branches = await this.git.getBranchesFromRemote(remoteName);

    await prompts({
      choices: branches.map((branch) => ({
        title: branch.replace("refs/heads/", ""),
      })),
      message: `Pick the Branch from ${remoteName}:`,
      name: "send_pr_to",
      type: "autocomplete",
    });
  }

  private async workflowForPullRequestDry(): Promise<void> {
    const {
      title,
      repo,
      base,
      s: sendTo,
      _: [, secondCommand],
    } = this.applicationProperties.config.argv;

    if (secondCommand) {
      return await this.github.fetchPullRequest(Number(secondCommand));
    }

    if (sendTo) {
      return await this.github.createPullRequest({ base, repo, title });
    }

    await this.github.listPullRequest(true);
  }

  private async workflowForPullRequestOnboard(): Promise<void> {
    const response = await prompts(
      this.commandsList.pull_request_options,
      promptConfig
    );

    switch (response.value) {
      case "get-pr": {
        const { pull_request_id } = await prompts(
          this.commandsList.insert_pull_request_id,
          promptConfig
        );

        this.github.fetchPullRequest(pull_request_id);

        this.logShortcut("gt pr -u username 111");

        break;
      }

      case "list-pr": {
        const data = await this.github.listPullRequest(true);

        if (data.length) {
          const { confirm_select_pr } = await prompts(
            this.commandsList.pull_request.list_pr.confirm_to_select_pr,
            promptConfig
          );

          this.logShortcut("gt pr -u username");

          if (confirm_select_pr) {
            const list_pr_answer = await prompts(
              [
                {
                  ...this.commandsList.get_pull_request_id,
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
                },
                {
                  message: "Pull Request ID",
                  name: "pull_request_id_2",
                  type: (prev) => (prev === "request-id" ? "number" : null),
                },
              ],
              promptConfig
            );

            const pull_request_id = list_pr_answer.pull_request_id_2
              ? list_pr_answer.pull_request_id_2
              : list_pr_answer.pull_request_id_1;

            this.github.fetchPullRequest(pull_request_id);

            this.logShortcut(`gt pr -u ${pull_request_id} `);
          }
        }

        break;
      }

      case "send-pr": {
        let [origins, defaultBranch] = await Promise.all([
          this.git.getOrigins(),
          this.git.getDefaultBranch(),
        ]);

        const repo = this.applicationProperties.config.repo;

        const myConfig = this.applicationProperties.config.config as any;

        const projectConfig = myConfig[repo];

        if (projectConfig) {
          origins = projectConfig.remotes?.map((origin: string) => ({
            alias: origin,
            name: origin,
          }));
        }

        const last_commit = await this.git.getLastCommitMessage();

        const response = await prompts(
          [
            {
              ...this.commandsList.pull_request.send_pr.to,
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
            },
            this.commandsList.pull_request.send_pr.other_user,
            {
              ...this.commandsList.pull_request.send_pr.reference_branch,
              initial: defaultBranch,
            },
            {
              ...this.commandsList.pull_request.send_pr.reference_repository,
              initial: repo,
            },
            {
              ...this.commandsList.pull_request.send_pr.get_title,
              initial: last_commit,
            },
          ],
          promptConfig
        );

        const isOtherUser = response.send_pr_to === "other";

        const username = isOtherUser ? response.username : response.send_pr_to;

        if (isOtherUser) {
          await saveProjectConfig(repo, username, origins);
        }

        const { confirm_send_pr } = await prompts(
          this.commandsList.pull_request.send_pr.confirm,
          promptConfig
        );

        if (confirm_send_pr) {
          await this.github.createPullRequest({
            base: response.reference_branch,
            owner: username,
            repo: response.reference_repository,
            title: response.title,
          });

          this.logShortcut(`gt pr -s ${username}`);
        } else {
          console.log("No PR Confirmado");
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
      const response = await prompts(this.commandsList.onboard, promptConfig);

      action = response.value;
    }

    try {
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
    } catch (err) {
      console.log("ERexx", err);
    }
  }
}

export default CommandLine;
