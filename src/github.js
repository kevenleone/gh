const { Octokit } = require("@octokit/rest");

const { openBrowser } = require("./utils");

const Git = require("./git");

async function getGithubClient(auth) {
  const octokit = new Octokit({
    auth,
  });

  return octokit;
}

class Github {
  constructor(octokit, { me, owner, repo, fromUser }) {
    this.octokit = octokit;
    this.ssh = false;
    this.me = me;
    this.owner = fromUser || owner || me;
    this.repo = repo;
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

  async fetchPullRequest(pull_number) {
    const payload = {
      pull_number,
      repo: this.repo,
      owner: this.user || this.me,
    };

    console.log("Fetching Pull Request");

    const { data } = await this.octokit.rest.pulls.get(payload);

    const newBranch = `gt-pr-${data.number}`;
    const headBranch = data.head.ref;
    const repoUrl = this.ssh
      ? data.head.repo.ssh_url
      : data.head.repo.clone_url;

    await Git.fetch(repoUrl, headBranch, newBranch);

    await this.createComment(data.number);

    await Git.checkout(newBranch);
  }

  async createComment(issue_number) {
    const payload = {
      body: "Just starting reviewing :)",
      issue_number,
      repo: this.repo,
      owner: this.owner,
    };

    await this.octokit.issues.createComment(payload);

    console.log(`Add comment: ${chalk.blue(payload.body)}`);
  }

  async createPullRequest() {
    const head = await Git.getActualBranch();
    const title = await Git.getLastCommitMessage();

    console.log(`Sending PR to ${this.owner}`);

    await Git.push(head);

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

module.exports = { getGithubClient, Github };
