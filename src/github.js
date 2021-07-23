const { Octokit } = require("@octokit/rest");

const { openBrowser } = require("./utils");

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
  constructor(octokit, { me, owner, repo, fromUser }) {
    this.octokit = octokit;
    this.me = me;
    this.owner = fromUser || owner;
    this.repo = repo;
  }

  async getActualBranch() {
    const branch = await $`git branch --show-current`;

    return branch.stdout.trim();
  }

  async getLastCommitMessage() {
    const commitMessage = await $`git show-branch --no-name HEAD`;

    return commitMessage.stdout.replace("\n", "");
  }

  async listPullRequest() {
    const { owner, repo } = this;

    console.log(
      `Listing open pull requests on ${chalk.green(`${owner}/${repo}`)}`
    );

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

  async push(branch) {
    await $`git push --set-upstream origin ${branch}`;
  }

  async createPullRequest() {
    const head = await this.getActualBranch();
    const title = await this.getLastCommitMessage();

    console.log("Enviando PR para", this.owner, head);

    await this.push(head);

    const payload = {
      title,
      owner: this.owner,
      repo: this.repo,
      head: `${this.me}:${head}`,
      base: "master",
    };

    try {
      const {
        data: { number },
      } = await this.octokit.rest.pulls.create(payload);

      console.log(
        `Pull Request Sent To: ${chalk.green(`${this.owner}/${this.repo}`)}`
      );

      openBrowser(
        `https://github.com/${this.owner}/${this.repo}/pull/${number}`
      );
    } catch (err) {
      console.log("Error to Send PR", err);
    }
  }
}

module.exports = { getGithubClient, getOriginRemote, Github };
