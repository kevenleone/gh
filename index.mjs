#!/usr/bin/env zx

var argv = require("minimist")(process.argv.slice(3));

const { getConfig } = require("./src/credentials");
const { getGithubClient, getOriginRemote, Github } = require("./src/github");

console.log(chalk.yellow(`Starting Github Client ${new Date().toISOString()}`));

(async () => {
  const config = await getConfig();

  const octokit = await getGithubClient(config.token);

  const origin = await getOriginRemote();

  const { s: sendTo, u: fromUser } = argv;

  const github = new Github(octokit, {
    me: config.username,
    owner: origin[0],
    repo: origin[1],
    fromUser: fromUser || sendTo,
  });

  const [mainCommand] = argv._;

  const withFlags = argv.s || argv.u;

  switch (mainCommand) {
    case "pr": {
      if (sendTo) {
        github.createPullRequest();
      }

      if (!sendTo) {
        return await github.listPullRequest(fromUser);
      }
    }
  }
})();
