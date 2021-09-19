## 1.0.0

## 1.1.0

##### Upgrade Version of some libraries

* zx 2.0 > 4.0.2
* dayjs 1.10.6 > 1.10.7
* @octokit/rest 18.7.0 > 18.10.0

## 1.2.0

* Add new feature to sync commits from origin to upstream

## 1.3.0

*  Add binary file to package.json to avoid create mannual symlinks, now user just need to run yarn link to create `gitray` globally

## 1.4.0

* New feature: Forward Pull Request
    * Now users can forward PR from **userA** to **userB**, using shortcut or guided mode.
    Everything you need to do is:
        * Using shortcut `gitray pr forward -u userA userB 10`
        * Using guided `gitray > Pull Request > Forward` and answer the questions