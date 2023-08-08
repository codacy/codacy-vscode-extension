# Codacy VSCode Extension

This extension allows you to review and manage Codacy pull requests and issues directly in Visual Studio Code.

## Getting Started

1. Install the extension from within VS Code, download it from [the marketplace](https://aka.ms/vscodepr-download), or download the latest VISX file from the [releases page](https://github.com/codacy/codacy-vscode-extension/tree/main/releases).
1. Open your desired repository in VS Code. This repository must be already [added to Codacy](https://docs.codacy.com/organizations/managing-repositories/#adding-a-repository).
1. A new viewlet will appear on the activity bar, under the Codacy logo.
1. Follow the instructions to authenticate with Codacy.
1. You should be good to go!


## Configuring the extension

1. 


## Requirements

- Repository added to Codacy Cloud, and you have permissions to access it.


## Contributing

Global dependencies to install to work on VSCode extensions:
```
npm install --global @vscode/vsce
```

To build the extension:
```
npm run pack
```

To run the extension: 
- Select extention.ts file and then press F5 (Run -> Start Debug)
