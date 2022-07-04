import { BranchFileStats } from "../interfaces/types.js";
import { clearStdout } from "./utils.js";

class Git {
  private DEFAULT_USER_REMOTE = "origin";

  public async checkout(branch: string): Promise<void> {
    await $`git checkout ${branch}`;
  }

  public async getBranchesFromRemote(remoteName: string): Promise<string[]> {
    const remoteBranches = await $`git ls-remote --heads ${remoteName}`;

    const clearBranches = remoteBranches.stdout
      .split("\n")
      .map((remote) => remote.split("\t")[1])
      .filter(Boolean);

    return clearBranches;
  }

  public async getCurrentBranch(): Promise<string> {
    const branch = await $`git branch --show-current`;

    return clearStdout(branch);
  }

  public async getCurrentBranchFileStats(
    latestCommitId: string
  ): Promise<BranchFileStats[]> {
    const fileStatus = await $`git diff --stat ${latestCommitId}..HEAD`;

    const fileStatusStdout = fileStatus.stdout.split("\n").filter(Boolean);

    return fileStatusStdout[fileStatusStdout.length - 1]
      .trim()
      .split(",")
      .map((stat) => stat.trim())
      .map((stat) => {
        const [total, ...type] = stat.split(" ");

        return {
          total,
          type: type.join(" "),
        };
      });
  }

  public async getCurrentBranchCommitMessages(
    latestCommitId: string
  ): Promise<string[]> {
    const commitMessages =
      await $`git log --pretty=format:%s ${latestCommitId}..HEAD`;

    return commitMessages.stdout.split("\n");
  }

  private async getCommitsCount(branch = "master"): Promise<number> {
    const commit_count = await $`git rev-list --count ${branch}`;

    return Number(clearStdout(commit_count));
  }

  public async getCommitsSinceHead(): Promise<string[]> {
    const branch = await this.getLastBranchName();
    const commits = await $`git cherry -v ${branch}`;

    return commits.stdout
      .split("\n")
      .map((remote) => remote.split(" ").splice(2).join(" "))
      .filter(Boolean);
  }

  public async getDefaultBranch(): Promise<string> {
    const defaultBranch =
      await $`git remote show origin | awk '/HEAD branch/ {print $NF}'`;

    return clearStdout(defaultBranch);
  }

  public async fetch(
    repoUrl: string,
    headBranch: string,
    pullBranch: string
  ): Promise<void> {
    await $`git fetch ${repoUrl} ${headBranch}:${pullBranch} --no-tags`;
  }

  private async getLastBranchName(): Promise<string> {
    const branch = await $`git name-rev $(git rev-parse @{-1}) --name-only`;

    return clearStdout(branch);
  }

  public async getLatestCommitId(...branchNames: string[]): Promise<string> {
    if (branchNames.length === 1) {
      const latestHash = await $`git rev-parse ${branchNames[0]}`;

      return clearStdout(latestHash);
    }

    let latestCommitId = "";
    let latestTimestamp = 0;

    for (const branch of branchNames) {
      const commit_hash =
        await $`git log -n 1 ${branch} --pretty=format:%H:%cd --date=unix`;

      const [hash, _timestamp] = clearStdout(commit_hash).split(":");

      const timestamp = Number(_timestamp);

      if (timestamp > latestTimestamp) {
        latestCommitId = hash;
        latestTimestamp = timestamp;
      }
    }

    return latestCommitId;
  }

  public async getLastCommitMessage(): Promise<string> {
    const commitMessage = await $`git show-branch --no-name HEAD`;

    return clearStdout(commitMessage);
  }

  public async getOriginRemote(): Promise<string[]> {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout
      .replace(".git\n", "")
      .split("/")
      .slice(-2)
      .map((element) => element.trim());
  }

  public async getOrigins(): Promise<{ name: string; alias: string }[]> {
    const listOfRemotes = await $`git remote -v | grep fetch`;

    const remoteList = listOfRemotes.stdout
      .split("\n")
      .map((remote) => remote.split("\t"))
      .filter((remote) => remote.every(Boolean))
      .map((remote) => {
        const [alias, remoteLink] = remote;
        const new_remote =
          remoteLink && remoteLink.replace(" (fetch)", "").split("/");

        return {
          alias,
          name: new_remote[new_remote.length - 2]?.replace(
            "git@github.com:",
            ""
          ),
        };
      });

    return remoteList;
  }

  public async isProjectUsingGit(): Promise<boolean> {
    const gitDir = await nothrow($`git rev-parse --git-dir`);

    return gitDir.exitCode === 0;
  }

  public async push(
    branch: string,
    remote: string = this.DEFAULT_USER_REMOTE
  ): Promise<void> {
    await $`git push --set-upstream ${remote} ${branch} --force`;
  }

  /**
   * @description Function used to Fetch data from Upstream
   * And send it back to origin on default branch
   */

  public async sync(): Promise<void> {
    const [currentBranch, defaultBranch] = await Promise.all([
      this.getCurrentBranch(),
      this.getDefaultBranch(),
    ]);

    if (currentBranch !== defaultBranch) {
      return console.warn(
        `${chalk.yellow(`You cannot Sync out of ${defaultBranch}`)}`
      );
    }

    const startCommitCount = await this.getCommitsCount(defaultBranch);

    /**
     * This verbose is important at this point, to let users know
     * which files have been downloaded.
     */

    $.verbose = true;

    console.log("Sync in Progress");

    await $`git pull --rebase upstream ${currentBranch} && git push -f origin ${currentBranch}`;

    $.verbose = false;

    const endCommitCount = await this.getCommitsCount(defaultBranch);

    console.log(chalk.green("Sync Completed"));
    console.log(
      `${chalk.cyan(
        endCommitCount - startCommitCount
      )} new commits pushed to ${currentBranch}`
    );
  }

  async updateGitray(): Promise<void> {
    const gitrayPath = process.env.GITRAY_PATH;

    if (!gitrayPath) {
      return;
    }

    const currentChanges = await $`git diff --shortstat`;

    within(async () => {
      cd(gitrayPath);

      const currentBranch = await this.getCurrentBranch();

      const hasChanges = !!currentChanges.stdout.trim();

      if (hasChanges) {
        return console.warn(
          chalk.red(
            `Is not possible to Update ${process.env.APP_NAME} with changes/staged, stash or remove the changes and try again.`
          )
        );
      }

      await $`git pull --rebase origin ${currentBranch}`;

      const yarnVersion = await $`yarn -v`;

      $.verbose = true;

      await within(async () => {
        if (yarnVersion.stdout.trim()) {
          await $`yarn build`;
        } else {
          await $`npm run build`;
        }
      });

      console.log(`${process.env.APP_NAME} Update Completed`);
    });
  }

  public async verifyBranchExistLocal(branch: string): Promise<boolean> {
    const branchExist = await nothrow($`git rev-parse --verify ${branch}`);

    return !!branchExist.stdout;
  }
}

export { Git };

export default new Git();
