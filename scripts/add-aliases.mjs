#!/usr/bin/env zx
/* eslint-disable @typescript-eslint/no-var-requires */
/// <reference types="zx"/>

const prompts = require("prompts");

export const promptConfig = {
  onCancel: () => {
    console.log("No data will be saved");
    process.exit(1);
  },
};

$.verbose = false;

(async () => {
  const currentDirProcess = await $`cd ../ && pwd`;
  const currentDir = currentDirProcess.stdout.trim();

  const { alias, bash } = await prompts(
    [
      {
        choices: [
          { title: "~/.bashrc", value: ".bashrc" },
          { title: "~/.zshrc", value: ".zshrc" },
        ],
        message: "Which Bash are you using ?",
        name: "bash",
        type: "select",
      },
      {
        hint: "",
        initial: "gh",
        message: "Which alias do you want to use, to call this CLI ?",
        name: "alias",
        type: "text",
      },
    ],
    promptConfig
  );

  const shellConfigRC = `${os.homedir()}/${bash}`;

  const aliasInUse = await nothrow(
    $`cat ${shellConfigRC} | grep "alias ${alias}"`
  );

  if (aliasInUse.stdout) {
    return console.log(chalk.magenta("Alias already in use, choose other"));
  }

  const { confirmation } = await prompts(
    {
      initial: true,
      message: `Are you sure, you want to write this alias ${alias} in your ${bash}`,
      name: "confirmation",
      type: "confirm",
    },
    promptConfig
  );

  if (confirmation) {
    await $`echo "alias ${alias}='${currentDir}/dist/index.js'" >> ${shellConfigRC}`;

    console.log(`Alias ${chalk.cyan(alias)} added in ${chalk.cyan(bash)}`);
    console.log(
      `Now, type this command in your terminal ${chalk.green(
        `source ${shellConfigRC}`
      )} to complete the configuration`
    );
  }
})();
