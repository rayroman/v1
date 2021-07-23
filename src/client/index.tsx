import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './site.scss';
import { App } from './App';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.hydrate(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root'),
);
