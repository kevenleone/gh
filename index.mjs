#!/usr/bin/env zx

var argv = require("minimist")(process.argv.slice(3));

const { getConfig } = require("./src/credentials");
const { getGithubClient, Github } = require("./src/github");

console.log(chalk.yellow(`Starting Github Client ${new Date().toISOString()}`));

(async () => {
  const config = await getConfig();

  const octokit = await getGithubClient(config.token);

  const github = new Github(octokit);

  const [mainCommand] = argv._;

  const { s: sendTo, u: fromUser } = argv;

  const withFlags = argv.s || argv.u;

  switch (mainCommand) {
    case "pr": {
      if (!withFlags) {
        return await github.listPullRequest(
          "pt-liferay-solutions",
          "liferay-portal"
        );
      }

      if (sendTo) {
        console.log("Enviando PR para", sendTo);
      }
    }
  }

  console.log(argv);
})();
