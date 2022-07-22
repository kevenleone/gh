import { Command } from "commander";

import { ApplicationProperties } from "../interfaces/types.js";
import Check from "./check.js";
import { Commands } from "./commands.js";
import Config from "./config.js";
import { Git } from "./git.js";
import { prompts } from "./utils.js";

class CommandLine {
  private applicationProperties: ApplicationProperties;
  private check: Check;
  private cli: Command;
  private commands: Commands;
  private git: Git;

  constructor(cli: Command, applicationProperties: ApplicationProperties) {
    this.applicationProperties = applicationProperties;
    this.check = new Check(applicationProperties);
    this.cli = cli;
    this.commands = new Commands(applicationProperties);
    this.commands = new Commands(applicationProperties);
    this.git = new Git();
  }

  /**
   * @description Show the Application options and actions, you may see a guided tour,
   * calling the application without arguments
   *
   * Some commands has the name Dry for no interface
   * and Onboard for Guided use
   */

  public async createCLI(): Promise<void> {
    this.cli
      .command("cli")
      .description("Guided way to use GitRay")
      .action(async () => {
        const response = await prompts({
          choices: [
            {
              title: "Pull Request",
              value: "pr",
            },
            { disabled: false, title: "Fetch", value: "fetch" },
          ],
          initial: 0,
          message: "Which Action do you want to perform?",
          name: "value",
          type: "select",
        });

        if (response.value === "pr") {
          return this.commands.workflowForPullRequestOnboard();
        }

        await this.commands.workflowForFetchOnboard();
      });

    this.cli
      .command("check")
      .description("Check PR Commit Messages, before sending a PR")
      .action(() => {
        this.check.verify();
      });

    this.cli
      .command("config")
      .description(
        "Configure Gitray with Github Credentials and desired options"
      )
      .action(async () => {
        await Config.askConfiguration(this.applicationProperties.config.config);
      });

    /**
     * Disabled, since not working yet.
     */

    // this.cli
    //   .command("fetch")
    //   .description("Use to fetch data from a specific remote")
    //   .action(async () => {
    //     await this.commands.workflowForFetchDry();
    //   });

    // this.cli
    //   .command("issues")
    //   .description("Use to manage Issues from Github")
    //   .action(() => {
    //     console.log("Disabled for now");
    //   });

    this.cli
      .command("pr")
      .description("Manage Pull Requests")
      .option(
        "-b, --base <destination branch>",
        "Use to define the destination branch"
      )
      .option(
        "-c, --comment <review comment>",
        "Add Pull Request Reviewing Comment"
      )
      .option("--no-comment", "No Pull Request Reviewing Comment", false)
      .option(
        "--no-report",
        "Don't create a Jira Report when a Pull Request is opened"
      )
      .option("-f, --forward <github username>", "Forward a PR")
      .option("-s, --send [github username]", "Send a PR to this Username")
      .option("-t, --title <pr title>", "Title of Pull Request")
      .option(
        "-u, --user [github username]",
        "List or Fetch PR from Github Username"
      )
      .action(async (cmd, { args }) => {
        await this.commands.workflowForPullRequestDry(cmd, args);
      });

    this.cli
      .command("update")
      .description("Update Gitray")
      .action(() => {
        this.git.updateGitray();
      });

    this.cli
      .command("sync")
      .description(
        "Syncronize your fork(origin) with latest code from Upstream"
      )
      .action(async () => {
        this.git.sync();
      });

    this.cli.parse(process.argv.filter((argv) => argv !== "--verbose"));

    return Promise.resolve();
  }
}

export default CommandLine;
