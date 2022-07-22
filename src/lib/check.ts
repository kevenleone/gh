import spinner from "ora";
import { ApplicationProperties } from "src/interfaces/types";

import { Git } from "./git.js";
import { Jira } from "./jira.js";
import Liferay from "./liferay.js";

class Check {
  private applicationProperties: ApplicationProperties;
  private git: Git;
  private jira: Jira;

  constructor(applicationProperties: ApplicationProperties) {
    this.applicationProperties = applicationProperties;
    this.git = new Git();
    this.jira = new Jira(applicationProperties);
  }

  public async verify(): Promise<void> {
    const spin = spinner("Starting Checks");

    if (
      !Liferay.repositories.includes(this.applicationProperties.config.repo)
    ) {
      spin.text = `Command valid only for [${chalk.magenta(
        Liferay.repositories.join(", ")
      )}] projects.`;
      spin.fail();
      return;
    }

    spin.color = "green";
    spin.start();

    try {
      const defaultBranch = await this.git.getDefaultBranch();

      const latestCommitId = await this.git.getLatestCommitId(
        `${defaultBranch}`,
        `origin/${defaultBranch}`,
        `upstream/${defaultBranch}`
      );

      const commits = await this.git.getCurrentBranchCommitMessages(
        latestCommitId
      );

      const isCommitsValid = await this.jira.validateJIRAProjectNames(commits);

      if (isCommitsValid) {
        spin.text = "All commit messages are valid";
        spin.succeed();
        return;
      }

      spin.text = "Fail to validate commit message";
      spin.fail();
    } catch (error) {
      spin.fail();

      console.error(error.message);
    }
  }
}

export default Check;
