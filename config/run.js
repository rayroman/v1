const path = require('path');
const spawn = require('cross-spawn');
const webpack = require('webpack');

const serverConfig = require('./server.webpack.config');

const compiler = webpack(serverConfig);

let node;

compiler.run(
  (err, results) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(results?.toString('minimal'));
    const compiledSuccessfully = !results?.hasErrors();

    if (compiledSuccessfully && !node) {
      console.log('Starting Node.js');
      node = spawn(
        'node',
        ['--inspect', path.resolve(__dirname, '../dist/server.js')],
        {
          stdio: 'inherit',
        }
      );
    }
  }
);
