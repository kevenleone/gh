import spinner from "ora";
import { ApplicationProperties, BranchFileStats } from "src/interfaces/types";

import { APP_NAME } from "./constants";
import { Git } from "./git";
import { Jira } from "./jira";

class Report {
  private BASE_IMAGE_URL =
    "https://raw.githubusercontent.com/kevenleone/gh/main/images";

  private INSERTIONS_THRESHOLD_LIMIT = 1000;
  private git: Git;
  private jira: Jira;

  constructor(applicationProperties: ApplicationProperties) {
    this.jira = new Jira(applicationProperties);
    this.git = new Git();
  }

  public async getJiraReport(jiraTicketIds: string[]): Promise<string> {
    const reports = await Promise.all(
      jiraTicketIds.map((jiraTicketId) => this.jira.getJiraTicket(jiraTicketId))
    );

    let comment =
      `## :fire: GitRay Report \nDescribe the big picture of your changes here to communicate to the maintainers why we should accept this pull request. If it fixes a bug or resolves a feature request, be sure to link to that issue.\n ## Jira Tasks \n\n <html>`.trim();

    const row = (question: string, value: string) => `<tr>
            <th>${question}</th>
            <td>${value}</td>
        </tr>`;

    for (const report of reports) {
      comment += `<details><summary>More details about: <b>${report.key} ${
        report.summary
      }</b>.</summary>
              <br />
              <table>
              ${row(
                "Title",
                `<a target="_blank" href="${this.jira.JIRA_PUBLIC_URL}/${report.key}">${report.summary}</a>`
              )}
              ${row("Type", report.issuetype.name)}
              ${row("Priority", report.priority.name)}
              ${row(
                "Sub-Tasks",
                report.subtasks.length
                  ? `${
                      report.subtasks.filter(
                        ({
                          fields: {
                            status: {
                              statusCategory: { key },
                            },
                          },
                        }: any) => key === "done"
                      ).length
                    }/${report.subtasks.length} Completed`
                  : "No Sub-Tasks Opened"
              )}
              ${row("Status", report.status.name)}
              ${row("Assignee", report.assignee.displayName)}
              ${row("Reporter", report.reporter.displayName)}
                </table>
          </details>`;
    }

    comment += "</html> \n\n";
    comment += `---\n\nHey, don't forget to update all related tickets with correct status, such as **In Review** :wink: \n`;

    return comment;
  }

  async getStatReport(
    branchFileStat: BranchFileStats[],
    report: string
  ): Promise<string> {
    let newReport = report;

    newReport += `### Git Stats \n\n`;
    newReport +=
      branchFileStat.map(({ total, type }) => `${total} ${type}`).join(", ") +
      "\n\n";

    const insertions = branchFileStat.find(({ type }) =>
      type.includes("insertions")
    );

    if ((insertions?.total || 0) >= this.INSERTIONS_THRESHOLD_LIMIT) {
      newReport += `This PR is too huge for one to review :broken_heart: \n\n`;
      newReport += `![Batman](${this.BASE_IMAGE_URL}/no-way.gif)`;
    } else {
      newReport += `![](${this.BASE_IMAGE_URL}/looks-good.gif)`;
    }

    return newReport;
  }

  async createReport(): Promise<string> {
    if (!this.jira.enabled) {
      return "";
    }

    const spin = spinner(`Creating ${APP_NAME} Report Template`);

    spin.color = "green";
    spin.start();

    try {
      let report = "";

      const latestCommitId = await this.git.getLatestCommitId(
        "master",
        `origin/master`,
        `upstream/master`
      );

      const commits = await this.git.getCurrentBranchCommitMessages(
        latestCommitId
      );

      const branchFileStats = await this.git.getCurrentBranchFileStats(
        latestCommitId
      );

      const jiraTickets = this.jira.getTicketsFromCommitMessages(commits);

      report = await this.getJiraReport(jiraTickets);
      report = await this.getStatReport(branchFileStats, report);

      spin.text = "Report Template Created";

      spin.succeed();

      return report;
    } catch (error) {
      spin.fail();

      console.error(error.message);

      return "";
    }
  }
}

export { Report };
