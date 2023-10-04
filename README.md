<p align="center">
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License MIT">
  </a>
</p>

<p align="center">
Simple CLI to help users with Github Commands using <a href="https://github.com/google/zx">google/zx</a>
</p>

Table of Contents
-----------------

*   [Getting Started](#getting-started)
*   [Requirements](#requirements)
*   [Installation](#installation)
*   [Configuration](#configuration)
*   [Contributing](#contributing)
*   [License](#license)

Getting Started
---------------

GitRay is a command-line tool designed to assist beginners with common GitHub activities, especially those used at Liferay. It simplifies interactions with GitHub, such as sending, listing, and fetching pull requests from forks.

**Please note that this project is under development and may not fulfill all your needs. If you require a more robust solution, we recommend using [GitHub CLI](https://github.com/cli/cli) or [Node-GH](https://github.com/node-gh/gh).**

This project drew inspiration from Node-GH.

Requirements
------------

Node.js >= `14.8.0`
Git >= `1.7.0`

Installation
------------

```bash
npm i -g zx
npm install
npm link
```

After running `npm link`, an alias will be added to your bash. You can use `gitray` in any Git project to check if it's working.

Configuration
-------------

After setting up GitRay, open a terminal and run the `gitray` command to start the initial configuration process. Follow these steps:

![First access configuration](./images/config.png)


1.  **What is your GitHub username**: Enter your GitHub username.
    
2.  **What is your GitHub Signature**: This signature is used when you are fetching a pull request from someone, and a message is added there.
    
3.  **What is your GitHub Token**: You need to create a GitHub Personal Access Token for this. Here's how:
    
    *   Log in to your GitHub account.
    *   Go to the [GitHub Personal Access Tokens page](https://github.com/settings/tokens).
    *   Generate a new token:
        *   Provide a name for the token.
        *   Set the expiration date (we suggest choosing a longer expiration date or no expiration for this token).
        *   Under "Select Scopes," check all the boxes inside the **repo** section.
    *   Click "Generate Token."
    *   Copy the generated token inside the green box and use it as your GitHub Token in this CLI.
4.  **What is your Branch Prefix**: When fetching a pull request from someone, a branch is created using this prefix and the Pull Request ID. For example, if you are fetching Pull Request #100 from `is-solutions-delivery/liferay-portal`, a branch called **pr-100** will be created.

After completing the initial configuration, GitRay will be ready for use.

![First access configuration](./images/home.png)

Contributing
------------

If you liked the project and want to cooperate feel free to fork this repository and send Pull Requests.

All kinds of contributions are very welcome and appreciated

-   ⭐️ Star the project
-   🐛 Find and report issues
-   📥 Submit PRs to help solve issues or add features

License
-------
MIT license, Copyright (c) 2021 Keven Leone.
