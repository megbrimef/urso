const path = require('path');
const packageJson = require('./package.json');
const root = process.cwd();

const version = packageJson.version;

module.exports = () => {
  const config = {
    entry: {
      index: path.resolve(root, 'src', 'js', 'index.js')
    },
    output: {
      path: path.resolve(root, 'build'),
      filename: path.join('js', 'index.js'),
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /app\.js$/,
          loader: 'string-replace-loader',
          options: {
            search: 'APP_VERSION',
            replace: version,
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }
      ]
    }
  };
  return config;
};
