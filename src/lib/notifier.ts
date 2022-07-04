import boxen from "boxen";

class Notifier {
  private currentVersion: string;
  private lastVersion: string;

  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }

  public async checkVersionAndNotify(): Promise<void> {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/kevenleone/gh/main/package.json"
      );

      if (response.ok) {
        const data = await response.json();

        this.lastVersion = data.version;

        await this.notify();
      }
    } catch (error) {}
  }

  public notify(): void {
    if (this.lastVersion === this.currentVersion) {
      return console.log(`CLI Version: ${this.currentVersion}`);
    }

    console.log(
      boxen(
        `Update Available ${chalk.gray(this.currentVersion)} -> ${chalk.green(
          this.lastVersion
        )}\n Run ${chalk.blue("gitray update")} to update`,
        {
          borderColor: "yellow",
          borderStyle: "round",
          margin: 1,
          padding: 1,
          textAlignment: "center",
        }
      )
    );
  }
}

export default Notifier;
