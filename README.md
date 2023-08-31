# Codacy Visual Studio Code Extension

The Codacy extension for Visual Studio Code helps you review and manage issues found by Codacy by highlighting problematic code patterns, notifying you whether a pull request is up to standards, and displaying code quality metrics directly within Visual Studio Code.

[Codacy](https://www.codacy.com/) is an automated code review tool that helps your team write high-quality code by analyzing over 40 programming languages, such as PHP, JavaScript, Python, Java, and Ruby. Codacy lets you define and enforce your own quality rules, code patterns, and quality settings to prevent issues in your codebase.

## Prerequisites
1.  You have a [Codacy account](https://www.codacy.com/signup-codacy).
2.  The repository you’re working on has been [added to Codacy Cloud](https://docs.codacy.com/organizations/managing-repositories/#adding-a-repository).
3.  You have at least [Repository Read permissions](https://docs.codacy.com/organizations/roles-and-permissions-for-organizations/) for the repository you’re working on.

## Installation

You can install the extension from within Visual Studio Code (Cmd+Shift+X or Ctrl+Shift+X), or from [the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=codacy-app.codacy).

## Contributing

Thank you for your interest in contributing to the Codacy VS Code Extension! This extension aims to provide an integrated experience for maintaining code quality within your VS Code environment, leveraging Codacy's automated code reviews.

Before diving in, there are some guidelines and steps you should follow. This `CONTRIBUTING.md` is here to help you contribute to this project.

### Prerequisites

-  The latest version of [Visual Studio Code](https://code.visualstudio.com/download).
-  [Node.js](https://nodejs.org/en/download/) (we recommend using [nvm](https://github.com/nvm-sh/nvm)).
-  Install global dependencies to work on Visual Studio Code extensions:  `npm install --global @vscode/vsce`.


### Running the extension locally

Select the file `src/extension.ts` and press F5 (Run --> Start Debug).

### Updating the API client

We use [OpenAPI Typescript Codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) to generate the API client. The API client is generated automatically when the extension is built. If you want to update the API client to a newer version, you can do so by running the following command:

1.  Update the API version in the `fetch-api` script in `package.json` to the desired version.
2.  Run `npm run update-api` to fetch the API specification from Codacy and generate the Typescript client code.


### Publishing the extension

To build the extension:

    npm run package-visx
