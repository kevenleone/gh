import { clearStdout } from "./utils";

class Git {
  async getOriginRemote(): Promise<string[]> {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
  }

  async getBranchesFromRemote(remoteName: string): Promise<string[]> {
    const remoteBranches = await $`git ls-remote --heads ${remoteName}`;

    const clearBranches = remoteBranches.stdout
      .split("\n")
      .map((remote) => remote.split("\t")[1])
      .filter(Boolean);

    return clearBranches;
  }

  async getOrigins(): Promise<{ name: string; alias: string }[]> {
    const listOfRemotes = await $`git remote -v | grep fetch`;

    const remoteList = listOfRemotes.stdout
      .split("\n")
      .map((remote) => remote.split("\t"))
      .filter((remote) => remote.every(Boolean))
      .map((remote) => {
        const [alias, remoteLink] = remote;
        const new_remote =
          remoteLink && remoteLink.replace(" (fetch)", "").split("/");

        return { alias, name: new_remote[new_remote.length - 2] };
      });

    return remoteList;
  }

  async getDefaultBranch(): Promise<string> {
    const defaultBranch =
      await $`git remote show origin | awk '/HEAD branch/ {print $NF}'`;

    return clearStdout(defaultBranch);
  }

  async getActualBranch(): Promise<string> {
    const branch = await $`git branch --show-current`;

    return clearStdout(branch);
  }

  async getLastCommitMessage(): Promise<string> {
    const commitMessage = await $`git show-branch --no-name HEAD`;

    return clearStdout(commitMessage);
  }

  async push(branch: string): Promise<void> {
    await $`git push --set-upstream origin ${branch}`;
  }

  async checkout(branch: string): Promise<void> {
    await $`git checkout ${branch}`;
  }

  async fetch(
    repoUrl: string,
    headBranch: string,
    pullBranch: string
  ): Promise<void> {
    await $`git fetch ${repoUrl} ${headBranch}:${pullBranch} --no-tags`;
  }
}

export { Git };
export default new Git();
