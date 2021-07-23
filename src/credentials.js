const prompts = require("prompts");

const configFile = os.homedir() + "/.gh.github.json";

async function saveCredentials(credentials) {
  await fs.writeFile(configFile, JSON.stringify(credentials));
}

async function askConfiguration(initial) {
  const questions = [
    {
      type: "text",
      initial: initial.username,
      name: "username",
      message: "What is your GitHub username?",
    },
    {
      type: "text",
      name: "review_signature",
      initial: initial.review_signature || "Just starting reviewing :)",
      message: "What is your Review Signature?",
    },
    {
      type: "password",
      name: "token",
      initial: initial.token,
      message: "What is your GitHub Token?",
    },
    {
      type: "text",
      name: "branch_prefix",
      initial: initial.branch_prefix || "pr-",
      message: "What is your Branch Prefix?",
    },
  ];

  const credentials = await prompts(questions, {
    onCancel: () => {
      console.log("No data will be saved");
      process.exit(1);
    },
  });

  await saveCredentials(credentials);

  return credentials;
}

async function getConfig() {
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

module.exports = { getConfig, askConfiguration };
