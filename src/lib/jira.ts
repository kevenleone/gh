import { ApplicationProperties } from "src/interfaces/types";

/* eslint-disable no-labels */
class Jira {
  private projectNames = [
    "BLADE",
    "CLDSVCS",
    "COMMERCE",
    "IDE",
    "ISOPS",
    "ISSUP",
    "LOOP",
    "LPS",
    "LRAC",
    "LRCI",
    "LRDOCS",
    "LRIS",
    "LRQA",
    "OAUTH2",
    "POSHI",
    "RELEASE",
    "SYNC",
    "TR",
  ];

  private credentials: string;
  public enabled: boolean;
  public JIRA_PUBLIC_URL = "https://issues.liferay.com/browse";

  constructor(applicationProperties: ApplicationProperties) {
    const stored_credentials = applicationProperties.config.config;

    this.credentials = stored_credentials.jira_credential;
    this.enabled =
      stored_credentials.jira_integration &&
      applicationProperties.config.repo === "liferay-portal";
  }

  public async getJiraTicket(jiraTicketId: string): Promise<any> {
    if (!this.enabled) {
      throw new Error("You must enable Jira Integration to use Report");
    }

    const response = await fetch(
      `https://issues.liferay.com/rest/api/2/issue/${jiraTicketId}`,
      {
        headers: {
          Authorization: "Basic " + this.credentials,
          "Content-Type": "application/json",
        },
      }
    );

    const { fields, key } = await response.json();

    return {
      assignee: fields.assignee,
      creator: fields.creator,
      issuetype: fields.issuetype,
      key,
      priority: fields.priority,
      reporter: fields.reporter,
      status: fields.status,
      subtasks: fields.subtasks,
      summary: fields.summary,
    };
  }

  public getTicketsFromCommitMessages(commitMessages: string[]): string[] {
    const jiraTicketIds = [];

    for (const commitMessage of commitMessages) {
      for (const projectName of this.projectNames) {
        if (commitMessage.includes(projectName)) {
          jiraTicketIds.push(commitMessage.split(" ")[0]);
        }
      }
    }

    return [...new Set(jiraTicketIds)];
  }

  public async validateJIRAProjectNames(
    commitMessages: string[]
  ): Promise<void> {
    outerLoop: for (const commitMessage of commitMessages) {
      if (
        commitMessage.startsWith("Revert ") ||
        commitMessage.startsWith("artifact:ignore") ||
        commitMessage.startsWith("build.gradle auto SF") ||
        commitMessage.endsWith("/ci-merge.")
      ) {
        continue;
      }

      for (const projectName of this.projectNames) {
        if (commitMessage.includes(projectName)) {
          continue outerLoop;
        }
      }

      console.error(
        chalk.red(`\nFound formatting issues: ${chalk.white(commitMessage)}
      ${chalk.magenta(
        "At least one commit message is missing a reference to a required JIRA project:"
      )}
      ${chalk.green(this.projectNames.join(", "))}`)
      );
    }
  }
}

export { Jira };
