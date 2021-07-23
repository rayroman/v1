import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as fs from 'fs';
import * as path from 'path';
import { StaticRouter } from 'react-router-dom';
import unescape from 'lodash/unescape';
import { App } from '../client/App';
import { Html } from './Html';

const DOCTYPE_HTML = '<!DOCTYPE html>';

// Root file is from `./dist'
const distFolder = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder);
}

fs.promises.writeFile(
  path.resolve(distFolder, './template.html'),
  unescape(DOCTYPE_HTML + ReactDOMServer.renderToStaticMarkup(
    React.createElement(
      Html,
      null,
      React.createElement(
        StaticRouter,
        null,
        React.createElement(App),
      ),
    ),
  )),
).then(() => {
  console.log('write success');
  process.exit(0);
}).catch((err) => {
  console.error('[Server] error:', err);
  process.exit(1);
});
