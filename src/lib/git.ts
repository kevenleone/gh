import { clearStdout } from "./utils";

class Git {
  public async getOriginRemote(): Promise<string[]> {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
  }

  private async getLastBranchName(): Promise<string> {
    const branch = await $`git name-rev $(git rev-parse @{-1}) --name-only`;

    return clearStdout(branch);
  }

  public async verifyBranchExistLocal(branch: string): Promise<boolean> {
    const branchExist = await nothrow($`git rev-parse --verify ${branch}`);

    return !!branchExist.stdout;
  }

  public async getCommitsSinceHead(): Promise<string[]> {
    const branch = await this.getLastBranchName();
    const commits = await $`git cherry -v ${branch}`;

    return commits.stdout
      .split("\n")
      .map((remote) => remote.split(" ").splice(2).join(" "))
      .filter(Boolean);
  }

  public async getBranchesFromRemote(remoteName: string): Promise<string[]> {
    const remoteBranches = await $`git ls-remote --heads ${remoteName}`;

    const clearBranches = remoteBranches.stdout
      .split("\n")
      .map((remote) => remote.split("\t")[1])
      .filter(Boolean);

    return clearBranches;
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

  public async getDefaultBranch(): Promise<string> {
    const defaultBranch =
      await $`git remote show origin | awk '/HEAD branch/ {print $NF}'`;

    return clearStdout(defaultBranch);
  }

  public async getActualBranch(): Promise<string> {
    const branch = await $`git branch --show-current`;

    return clearStdout(branch);
  }

  public async getLastCommitMessage(): Promise<string> {
    const commitMessage = await $`git show-branch --no-name HEAD`;

    return clearStdout(commitMessage);
  }

  public async push(branch: string): Promise<void> {
    await $`git push --set-upstream origin ${branch} --force`;
  }

  public async checkout(branch: string): Promise<void> {
    await $`git checkout ${branch}`;
  }

  public async fetch(
    repoUrl: string,
    headBranch: string,
    pullBranch: string
  ): Promise<void> {
    await $`git fetch ${repoUrl} ${headBranch}:${pullBranch} --no-tags`;
  }

  /**
   * @description Function used to Fetch data from Upstream
   * And send it back to origin on default branch
   */

  public async sync(): Promise<void> {
    const [actualBranch, defaultBranch] = await Promise.all([
      this.getActualBranch(),
      this.getDefaultBranch(),
    ]);

    if (actualBranch !== defaultBranch) {
      return console.warn(
        `${chalk.yellow(`You cannot Sync out of ${defaultBranch}`)}`
      );
    }

    /**
     * This verbose is important at this point, to let users know
     * which files have been downloaded.
     */

    $.verbose = true;

    console.log("Sync in Progress");

    await $`git pull --rebase upstream ${actualBranch} && git push -f origin ${actualBranch}`;

    console.log(`${chalk.green("Sync Completed")}`);
  }
}

export { Git };

export default new Git();
