#!/usr/bin/env zx

import figlet from "figlet";
import minimist from "minimist";

import CommandLine from "./lib/cli";
import { getConfig } from "./lib/credentials";
import Git from "./lib/git";
import { getGithubClient } from "./lib/github";

const argv = minimist(process.argv.slice(3));

/**
 * @description If you want to see what happens under the hoods, use the flag --verbose
 */

$.verbose = !!argv.verbose;

class Application {
  /**
   * @description Just a ASCII Art
   */

  private welcome(): void {
    console.log(
      figlet.textSync("GitRay", {
        font: "Big",
      })
    );
  }

  /**
   * @description The principal workflow of the Application is here
   * Also, the SETUP and configurations are made here and used in all application
   */

  public async run(): Promise<void> {
    this.welcome();

    const config = await getConfig();

    const [octokit, origin] = await Promise.all([
      getGithubClient(config.token),
      Git.getOriginRemote(),
    ]);

    const { s: sendTo, u: fromUser } = argv;

    const applicationProperties = {
      config: {
        argv,
        config,
        fromUser: fromUser || sendTo,
        owner: origin[0],
        repo: origin[1],
      },
      octokit,
    };

    const cli = new CommandLine(applicationProperties);

    await cli.showCommands();
  }
}

const application = new Application();

application.run();
