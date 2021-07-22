const { Octokit } = require("@octokit/rest");

async function getGithubClient(auth) {
  const octokit = new Octokit({
    auth,
  });

  return octokit;
}

async function getOriginRemote() {
  const remote_origin = await $`git config --get remote.origin.url`;

  return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
}

class Github {
  constructor(octokit, owner, repo) {
    this.octokit = octokit;
    this.owner = owner;
    this.repo = repo;
  }

  async listPullRequest(owner, repo) {
    const pulls = await this.octokit.rest.pulls.list({
      owner,
      repo,
    });

    if (pulls.data.length) {
      console.table(
        pulls.data.map(({ number, state, title, user, created_at }) => ({
          "#": `#${number}`,
          Title: title,
          Author: `@${user.login}`,
          Opened: created_at,
          Status: state.toUpperCase(),
        }))
      );
    } else {
      console.log("No Pull Request found");
    }
  }

  async createPullRequest() {}
}

module.exports = { getGithubClient, getOriginRemote, Github };
