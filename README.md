# Codacy VSCode Extension

This extension allows you to review and manage Codacy pull requests and issues directly in Visual Studio Code.

## Getting Started

1.  Install the extension from within VS Code, download it from [the marketplace](https://aka.ms/vscodepr-download), or download the latest VISX file from the [releases page](https://github.com/codacy/codacy-vscode-extension/tree/main/releases).
2.  Open your desired repository in VS Code. This repository must be already [added to Codacy](https://docs.codacy.com/organizations/managing-repositories/#adding-a-repository).
3.  A new viewlet will appear on the activity bar, under the Codacy logo.
4.  Follow the instructions to authenticate with Codacy.
5.  You should be good to go!

## Configuring the extension

1.

## Requirements

*   Repository added to Codacy Cloud, and you have permissions to access it.

## Contributing

Global dependencies to install to work on VSCode extensions:

    npm install --global @vscode/vsce

To build the extension:

    npm run package-visx

To run the extension:

*   Select extention.ts file and then press F5 (Run -> Start Debug)

### Update API

We use [OpenAPI Typescript Codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) to generate the API client. The API client is generated automatically when the extension is built. If you want to update the API client to a newer version, you can do so by running the following command:

1.  Update the API version in the `fetch-api` script in `package.json` to the desired version.
2.  Run `npm run update-api` to fetch the API specification from Codacy and generate the Typescript client code.
