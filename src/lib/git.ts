import { clearStdout } from "./utils";

class Git {
  async getOriginRemote(): Promise<string[]> {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
  }

  async getOrigins(): Promise<string[]> {
    const list_of_remotes = await $`git remote -v | grep fetch`;

    const remote_list = list_of_remotes.stdout
      .split("\n")
      .map((remote) => remote.split("\t")[1])
      .filter(Boolean)
      .map((remote) => {
        const new_remote = remote && remote.replace(" (fetch)", "").split("/");
        return new_remote[new_remote.length - 2];
      });

    return remote_list;
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
