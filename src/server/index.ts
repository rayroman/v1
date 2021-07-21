import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as fs from 'fs';
import * as path from 'path';
import { App } from '../client/App';

const DOCTYPE_HTML = '<!DOCTYPE html>';

const distFolder = path.resolve(__dirname, '../../dist');
if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder);
}

fs.promises.writeFile(
  path.resolve(distFolder, './t.txt'),
  DOCTYPE_HTML + ReactDOMServer.renderToStaticMarkup(
    React.createElement(App)
  )
).then(() => {
  console.log('write success');
  process.exit(0);
}).catch((err) => {
  console.error('[Server] error:', err);
  process.exit(1);
});
