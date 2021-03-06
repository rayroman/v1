const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const babelOptions = require('./babel.config.js');

const templatePath = path.resolve(__dirname, '../dist/template.html');

if (!fs.existsSync(templatePath)) {
  console.error('[Build] Template does not exist');
  return;
}

module.exports = function (env) {
  const isProduction = !!env.production;
  return {
    name: 'client',
    entry: {
      client: path.resolve(__dirname, '../src/client/index.tsx'),
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval',
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
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
        {
          test: /\.(ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            // Don't prepend `static` since that's already part of the output
            // path.
            filename: 'fonts/[hash:8][ext]',
          },
        },
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: isProduction ? '[name].[contenthash:8].css' : '[name].css' }),
      new HtmlWebpackPlugin({
        template: templatePath,
        title: 'Test SSR page',
      }),
    ],
  }
};
