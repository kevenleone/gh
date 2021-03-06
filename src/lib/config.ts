import { Configuration } from "../interfaces/types.js";
import { prompts } from "./utils.js";

class Config {
  private static configFile = os.homedir() + "/.gh.github.json";

  static async askConfiguration(
    initial?: Configuration
  ): Promise<Configuration> {
    const jira: { jira_credential?: string } = {};

    const _credentials = await prompts([
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
      {
        initial: initial?.jira_integration,
        message: "Do you want to use Jira Integration ?",
        name: "jira_integration",
        type: "confirm",
      },
    ]);

    if (_credentials.jira_integration) {
      const [initial_jira_user, initial_jira_password] = Buffer.from(
        initial?.jira_credential || "",
        "base64"
      )
        .toString("ascii")
        .split(":");

      console.log(
        chalk.cyan(
          "👮 For your safety, password will be hidden and encrypted. Also it's only stored in your machine"
        )
      );

      const { jira_password, jira_user } = await prompts([
        {
          initial: initial_jira_user,
          message: "Jira User",
          name: "jira_user",
          type: "text",
          validate: (user) => !!user,
        },
        {
          hint: "For your safety, this password is hidden and encrypted. Also it's only stored in your machine",
          initial: initial_jira_password,
          message: "Jira Password",
          name: "jira_password",
          type: "password",
          validate: (password) => !!password,
        },
      ]);

      jira.jira_credential = Buffer.from(
        `${jira_user}:${jira_password}`
      ).toString("base64");
    }

    const credentials = { ...initial, ...jira, ..._credentials };

    await this.saveConfiguration(credentials as Configuration);

    return credentials as Configuration;
  }

  static async getConfig(): Promise<Configuration> {
    let credentials;
    try {
      const config = await fs.readFile(this.configFile);
      credentials = JSON.parse(config.toString());
    } catch (err) {
      console.log(
        chalk.blue("Credentials not found, answer the questions below")
      );

      credentials = await this.askConfiguration();
    }

    return credentials;
  }

  private static async saveConfiguration(configuration: Configuration) {
    await fs.writeFile(this.configFile, JSON.stringify(configuration));
  }

  static async saveProjectConfig(
    project: string,
    remote: string,
    defaultOrigins: { alias: string; name: string }[] = []
  ): Promise<void> {
    const config: any = await this.getConfig();

    if (!config[project]) {
      config[project] = {
        remotes: defaultOrigins,
      };
    }

    if (!config[project].remotes.includes(remote)) {
      config[project].remotes.push({ alias: remote, name: remote });
    }

    await this.saveConfiguration(config);
  }
}

export default Config;
