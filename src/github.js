const { Octokit } = require("@octokit/rest");

async function getGithubClient(auth) {
  const octokit = new Octokit({
    auth,
  });

  return octokit;
}

class Github {
  constructor(octokit) {
    this.octokit = octokit;
  }

  async listPullRequest(owner, repo) {
    const pulls = await this.octokit.rest.pulls.list({
      owner,
      repo,
    });

    console.table(
      pulls.data.map(({ number, title, user, created_at }) => ({
        "#": `#${number}`,
        Title: title,
        Author: `@${user.login}`,
        Opened: created_at,
      }))
    );
  }
}

module.exports = { getGithubClient, Github };
