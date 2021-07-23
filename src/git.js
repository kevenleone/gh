class Git {
  async getOriginRemote() {
    const remote_origin = await $`git config --get remote.origin.url`;

    return remote_origin.stdout.replace(".git\n", "").split("/").slice(-2);
  }

  async getActualBranch() {
    const branch = await $`git branch --show-current`;

    return branch.stdout.trim();
  }

  async getLastCommitMessage() {
    const commitMessage = await $`git show-branch --no-name HEAD`;

    return commitMessage.stdout.replace("\n", "");
  }

  async push(branch) {
    await $`git push --set-upstream origin ${branch}`;
  }

  async checkout(branch) {
    await $`git checkout ${branch}`;
  }

  async fetch(repoUrl, headBranch, pullBranch) {
    await $`git fetch ${repoUrl} ${headBranch}:${pullBranch} --no-tags`;
  }
}

module.exports = new Git();
