/// <reference types="zx"/>

import prompts, { PromptObject } from "prompts";

import { Configuration } from "../interfaces/types";

const configFile = os.homedir() + "/.gh.github.json";

async function saveConfiguration(configuration: Configuration | any) {
  await fs.writeFile(configFile, JSON.stringify(configuration));
}

async function askConfiguration(
  initial?: Configuration
): Promise<Configuration> {
  const questions: PromptObject[] = [
    {
      initial: initial?.username,
      message: "What is your GitHub username?",
      name: "username",
      type: "text",
    },
    {
      initial: initial?.review_signature || "Just starting reviewing :)",
      message: "What is your Review Signature?",
      name: "review_signature",
      type: "text",
    },
    {
      initial: initial?.token,
      message: "What is your GitHub Token?",
      name: "token",
      type: "password",
    },
    {
      initial: initial?.branch_prefix || "pr-",
      message: "What is your Branch Prefix?",
      name: "branch_prefix",
      type: "text",
    },
  ];

  const credentials = await prompts(questions, {
    onCancel: () => {
      console.log("No data will be saved");
      process.exit(1);
    },
  });

  await saveConfiguration(credentials as Configuration);

  return credentials as Configuration;
}

async function getConfig(): Promise<Configuration> {
  let credentials;
  try {
    const config = await fs.readFile(configFile);
    credentials = JSON.parse(config.toString());
  } catch (err) {
    console.log(
      chalk.blue("Credentials not found, answer the questions below")
    );

    credentials = await askConfiguration();
  }

  return credentials;
}

async function saveProjectConfig(
  project: string,
  remote: string,
  defaultOrigins: { alias: string; name: string }[] = []
): Promise<void> {
  const config: any = await getConfig();

  if (!config[project]) {
    config[project] = {
      remotes: defaultOrigins,
    };
  }

  if (!config[project].remotes.includes(remote)) {
    config[project].remotes.push({ alias: remote, name: remote });
  }

  await saveConfiguration(config);
}

export { getConfig, saveProjectConfig, askConfiguration };
