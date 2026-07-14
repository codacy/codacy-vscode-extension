//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: [
    { vscode: 'commonjs vscode' }, // the vscode-module is created on-the-fly and must be excluded. 📖 -> https://webpack.js.org/configuration/externals/
    // The Codacy analysis runner + its 30+ tool adapter packages are required from
    // node_modules at runtime (the whole node_modules ships — see .vscodeignore) rather
    // than bundled. This also keeps the adapters' lazy dynamic import() calls as runtime
    // requires. @codacy/codacy-mcp is unaffected (it is spawned, never imported).
    function ({ request }, callback) {
      if (request && /^@codacy\//.test(request)) {
        return callback(null, 'commonjs ' + request)
      }
      callback()
    },
  ],
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};
module.exports = [ extensionConfig ];