class Liferay {
  private JIRA_PROJECTS = [
    "BLADE",
    "CLDSVCS",
    "COMMERCE",
    "IDE",
    "LHC",
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

  public validateCommitPrefix(commit: string | string[]): boolean {
    return !!this.JIRA_PROJECTS.filter((jira_project) =>
      Array.isArray(commit)
        ? commit.some((cm) => cm.startsWith(jira_project))
        : commit.startsWith(jira_project)
    ).length;
  }
}

export default Liferay;
