import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './site.scss';
import { App } from './App';

ReactDOM.hydrate(<App />, document.getElementById('root'));
