import { clearStdout } from "./utils";

class Git {
  public async getOriginRemote(): Promise<string[]> {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
  }

  public async getCommitsSinceHead(): Promise<string[]> {
    const commits = await $`git cherry -v`;

    console.log({ commits: commits.stdout.split("\n") });

    return commits.stdout
      .split("\n")
      .map((remote) => remote.split("\t")[1])
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
}

export { Git };

export default new Git();
