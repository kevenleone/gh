#!/usr/bin/env zx

var argv = require("minimist")(process.argv.slice(3));

const { getConfig } = require("./src/credentials");
const { getGithubClient, getOriginRemote, Github } = require("./src/github");

console.log(chalk.yellow(`Starting Github Client ${new Date().toISOString()}`));

(async () => {
  const config = await getConfig();

  const octokit = await getGithubClient(config.token);

  const origin = await getOriginRemote();

  const github = new Github(octokit, origin[0], origin[1]);

  const [mainCommand] = argv._;

  const { s: sendTo, u: fromUser } = argv;

  const withFlags = argv.s || argv.u;

  switch (mainCommand) {
    case "pr": {
      if (!sendTo) {
        const owner = fromUser || github.owner;
        const repo = github.repo;

        console.log(
          `Listing open pull requests on ${chalk.green(`${owner}/${repo}`)}`
        );

        return await github.listPullRequest(owner, repo);
      }

      if (sendTo) {
        console.log("Enviando PR para", sendTo);
      }
    }
  }
})();
