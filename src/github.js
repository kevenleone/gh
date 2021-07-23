const { Octokit } = require("@octokit/rest");
const spinner = require("ora");

const { openBrowser } = require("./utils");

const Git = require("./git");

async function getGithubClient(auth) {
  const octokit = new Octokit({
    auth,
  });

  return octokit;
}

class Github {
  constructor(octokit, { argv, config, owner, repo, fromUser }) {
    this.argv = argv;
    this.config = config;
    this.octokit = octokit;
    this.ssh = false;
    this.me = config.username;
    this.owner = fromUser || owner || this.username;
    this.repo = repo;
  }

  async listPullRequest() {
    const { owner, repo } = this;

    const spin = spinner(
      `Listing open pull requests on ${chalk.green(`${owner}/${repo}`)}`
    );

    spin.color = "green";
    spin.start();

    const pulls = await this.octokit.rest.pulls.list({
      owner,
      repo,
    });

    if (pulls.data.length) {
      spin.succeed();

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
      spin.text = "No Pull Request found";
      spin.warn();
      // console.log("No Pull Request found");
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

    const newBranch = `${this.config.branch_prefix}${data.number}`;
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
      body: this.config.review_signature || "Just starting reviewing :)",
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
      base: this.argv.base || "master",
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
      console.log("Error to Send PR", err.message);
    }
  }
}

module.exports = { getGithubClient, Github };
