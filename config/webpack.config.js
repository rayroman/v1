const path = require('path');
const babelOptions = require('./babel.config.js');

module.exports = function (env) {
  const isProduction = !!env.production;
  return {
    name: 'client',
    entry: {
      client: path.resolve(__dirname, '../src/index.tsx'),
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: isProduction ? '[name].[contenthash:8][ext]' : '[name][ext]',
      publicPath: '/',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    target: 'web',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babelOptions,
          },
        },
      ]
    }
  }
};
