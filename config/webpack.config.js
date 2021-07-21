const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
    devServer: isProduction ? undefined : {
      contentBase: path.resolve(__dirname, '../dist'),
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    target: 'web',
    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [
            MiniCssExtractPlugin.loader,
            // Translates CSS into CommonJS
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                esModule: true,
                modules: {
                  namedExport: true,
                  exportLocalsConvention: 'dashesOnly',
                  localIdentName: isProduction ? '[contenthash:8]' : '[path][name]__[local]',
                },
              },
            },
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: babelOptions,
          },
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: isProduction ? '[name].css' : '[name].[contenthash:8].css' }),
      new HtmlWebpackPlugin({
        title: 'Ray Roman · Front end engineer, React, and TypeScript enthusiast'
      }),
    ],
  }
};
