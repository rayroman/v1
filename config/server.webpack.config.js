const path = require('path');
const nodeExternals = require('webpack-node-externals');
const babelOptions = require('./babel.config.js');

module.exports = {
  name: 'server',
  entry: {
    server: path.resolve(__dirname, '../src/server/index.ts'),
  },
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    // We put the publicPath as a forward slash here to make things simpler when
    // considering client JS output vs server DOM output for hydration. Also
    // keps it the same between dev config and prod configs.
    publicPath: '/',
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx'],
  },
  externals: [nodeExternals()],
  target: 'node',
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Translates CSS into CommonJS
          {
            loader: 'css-loader',
            options: {
              url: {
                filter: (url, resourcePath) => {
                  // We are already handling font files when the client config
                  // gets called, so we don't need process them here. Note:
                  // this won't result in any webpack error since we're ignoring
                  // these files and won't have to process them with a loader.
                  return !url.endsWith('.ttf');
                },
              },
              importLoaders: 1,
              esModule: true,
              modules: {
                namedExport: true,
                exportLocalsConvention: 'dashesOnly',
                localIdentName: '[path][name]__[local]',
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
    ],
  },
};
