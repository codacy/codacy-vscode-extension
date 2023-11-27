# Contributing

Thank you for your interest in contributing to the Codacy VS Code Extension! This extension aims to provide an integrated experience for maintaining code quality within your VS Code environment, leveraging Codacy's automated code reviews.

Before diving in, there are some guidelines and steps you should follow. This `CONTRIBUTING.md` is here to help you contribute to this project.

## Prerequisites

-   The latest version of [Visual Studio Code](https://code.visualstudio.com/download).
-   [Node.js](https://nodejs.org/en/download/) v14 or later. You can use [nvm](https://github.com/nvm-sh/nvm)) to manage multiple Node.js installations.
-   Install global dependencies to work on Visual Studio Code extensions:  `npm install --global @vscode/vsce`.

## Running the extension locally

Select the file `src/extension.ts` and press F5 (Run &rarr; Start Debug).

## Updating the API client

We use [OpenAPI Typescript Codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) to generate the API client. The API client is generated automatically when the extension is built. If you want to update the API client to a newer version, you can do so by running the following command:

1.  Update the API version in the `fetch-api` script in `package.json` to the desired version.
2.  Run `npm run update-api` to fetch the API specification from Codacy and generate the Typescript client code.

## Creating an issue

If you encounter a bug, please create an issue! However, before you do so, please check the existing issues to ensure you're not duplicating someone else's work.

## Submitting a Pull Request

Pull requests are always welcome! Before submitting a pull request:
 
-   Ensure your code passes all tests by running `npm test`.
-   If you're adding new functionality, please include tests for it.
-   If your changes require updates to the documentation, please include those changes within your pull request.

## Publishing the extension

To build the extension:

    npm run package-visx
