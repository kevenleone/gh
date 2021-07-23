#!/usr/bin/env zx

var argv = require("minimist")(process.argv.slice(3));

const { getConfig } = require("./src/credentials");
const { getGithubClient, Github } = require("./src/github");
const Git = require("./src/git");

console.log(chalk.yellow(`Starting Github Client ${new Date().toISOString()}`));

(async () => {
  const config = await getConfig();

  const octokit = await getGithubClient(config.token);

  const origin = await Git.getOriginRemote();

  const { s: sendTo, u: fromUser } = argv;

  const github = new Github(octokit, {
    me: config.username,
    owner: origin[0],
    repo: origin[1],
    fromUser: fromUser || sendTo,
  });

  const [mainCommand, secondCommand] = argv._;

  const withFlags = argv.s || argv.u;

  switch (mainCommand) {
    case "pr": {
      if (sendTo) {
        github.createPullRequest();
      } else {
        if (secondCommand) {
          return await github.fetchPullRequest(secondCommand);
        }

        await github.listPullRequest(fromUser);
      }
    }
  }
})();
