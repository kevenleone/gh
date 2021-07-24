#!/usr/bin/env zx

/// <reference types="zx"/>

import figlet from "figlet";
import minimist from "minimist";

import { askConfiguration, getConfig } from "./lib/credentials";
import Git from "./lib/git";
import { getGithubClient, Github } from "./lib/github";

const argv = minimist(process.argv.slice(3));

console.log(
  figlet.textSync("GITRAY", {
    font: "Big",
  })
);

(async () => {
  const config = await getConfig();

  const octokit = await getGithubClient(config.token);

  const origin = await Git.getOriginRemote();

  const { s: sendTo, u: fromUser } = argv;

  const github = new Github(octokit, {
    argv,
    config,
    fromUser: fromUser || sendTo,
    owner: origin[0],
    repo: origin[1],
  });

  const [mainCommand, secondCommand] = argv._;

  // const withFlags = argv.s || argv.u;

  switch (mainCommand) {
    case "pr": {
      if (sendTo) {
        github.createPullRequest();
      } else {
        if (secondCommand) {
          return await github.fetchPullRequest(Number(secondCommand));
        }

        await github.listPullRequest();
      }

      break;
    }

    case "config": {
      await askConfiguration(config);
      break;
    }

    case "info": {
      console.log("teste");
      break;
    }
  }
})();
