import * as React from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import * as styles from './App.module.scss';
import { Title } from './components/Title';
import { Provider } from './components/Provider';
import { SidewaysNavigation, SidewaysNavLink } from './components/Navigation/SidewaysNavigation';

export function App(): JSX.Element {
  return (
    <Provider>
      <div className={styles.root}>
        <SidewaysNavigation>
          <SidewaysNavLink to={{ pathname: '/', state: { target: 'info' } }}>
            about
          </SidewaysNavLink>
          <SidewaysNavLink to={{ pathname: '/', state: { target: 'contact' } }}>
            contact
          </SidewaysNavLink>
        </SidewaysNavigation>
        <Title className={styles.root__title}>
          Hello, world
        </Title>
      </div>
    </Provider>
  );
}
