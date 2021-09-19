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
    const alias = "gitray";
    console.info(
      `To repeat this command, easily, use this shorthand: ${chalk.cyan(
        `${alias} ${command}`
      )}`
    );
  }

  private async selectPRFromList(data: any[]) {
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

  private async workflowForPullRequestDry(): Promise<void> {
    const {
      base,
      user,
      comment,
      title,
      sendTo,
      _: [, mainCommand, secondaryCommand, thirdCommand],
    } = buildFlags(
      this.applicationProperties.config.argv,
      "base",
      "comment",
      "title",
      "user",
      "forward",
      "sendTo"
    );

    if (mainCommand === "forward") {
      if (!secondaryCommand || !thirdCommand) {
        console.error(
          `Example of Forward: ${chalk.cyan(
            "gh pr -u liferay pt-liferay-solutions 123"
          )}`
        );
        return console.error(`Exiting: ${chalk.red("Commands Missing")}`);
      }

      await this.github.forwardPullRequest(
        parseInt(thirdCommand, 10), // Pull Request ID
        user, // Owner
        secondaryCommand // Forward To
      );

      return;
    }

    if (mainCommand) {
      await this.github.fetchPullRequest(Number(mainCommand), comment);
    } else if (sendTo) {
      await this.github.createPullRequest({ base, repo: user, title });
    } else {
      await this.github.listPullRequest(true);
    }
  }

  private async workflowForPullRequestOnboard(): Promise<void> {
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

        this.logShortcut("pr -u username 111");

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
            const pull_request_id = await this.selectPRFromList(data);

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
            const pull_request_id = await this.selectPRFromList(data);

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
        await this.git.sync();
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
