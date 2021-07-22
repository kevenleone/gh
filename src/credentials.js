const configFile = "./config.json";

async function saveCredentials(credentials) {
  await fs.writeFile(configFile, JSON.stringify(credentials));
}

async function askCredentials() {
  let username = await question("What is your GitHub username ? ");
  let token = await question("What is your GitHub token ?");

  const credentials = { username, token };

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

    credentials = await askCredentials();
  }

  return credentials;
}

module.exports = { getConfig };
