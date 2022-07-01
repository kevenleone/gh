# :book: Changelog

## 3.0.0 - BREAKING CHANGE

- Upgrade google@zx to 7.0x
- Move from commonJS to EsModules
- Eslint is now working again
- **IMPORTANT** this version causes a breaking changes due the need to move from commonJS to ESModules, for those who uses a version before 3.0.x needs to run `yarn unlink gitray` and then `yarn link`.

## 2.9.0

- Fix bug to list and send PR 

## 2.8.0

- Upgrade devDependencies; 

## 2.7.0

- Check if it's a valid Git Repository; 

## 2.6.0

- Add flag to skip Jira Report creation using `--no-report` flag; 

## 2.5.0

- Add Total of new Commits after `sync` command; 

## 2.4.0

- Add Jira and Git Report as Optional Feature, first you need to configure:

`gitray config` and insert your Jira Credentials.

Note: This is an optional feature, only works for the one working on `Liferay Portal`, the credentials is only saved in users machine.

## 2.3.0

- Unnecessary `console.log` was removed

## 2.2.0

- Fix bug to Fetch Pull Request from a specific User

## 2.1.0

- Add options to get Pull Request with no comments.

## 2.0.0

- Use Commander to handle CLI entries, with CLI Help, Version and detailed options to be used
- Removed Detailed mode by Default, now you should use `gitray cli` to open guided mode
- Add Options and Helps for each used Command

## 1.6.0

- Fix logShortcut from Get Pull Request by ID, to use correct alias

## 1.5.0

- Get version directly from package.json using binary file

## 1.4.0

- New feature: Forward Pull Request
  - Now users can forward PR from **userA** to **userB**, using shortcut or guided mode.
    Everything you need to do is:
    _ Using shortcut `gitray pr forward -u userA userB 10`
    _ Using guided `gitray > Pull Request > Forward` and answer the questions

## 1.3.0

- Add binary file to package.json to avoid create mannual symlinks, now user just need to run yarn link to create `gitray` globally

## 1.2.0

- Add new feature to sync commits from origin to upstream

## 1.1.0

##### Upgrade Version of some libraries

- zx 2.0 > 4.0.2
- dayjs 1.10.6 > 1.10.7
- @octokit/rest 18.7.0 > 18.10.0

## :tada: 1.0.0

Project startup

##### Add dependencies as:

- zx
- typescript
- ora
- eslint
- prettier
