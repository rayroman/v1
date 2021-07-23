import * as React from 'react';
import * as styles from './App.module.scss';
import { Title } from './components/Title';
import { Provider } from './components/Provider';
import { SidewaysNavigation, SidewaysNavLink } from './components/Navigation/SidewaysNavigation';

export function App(): JSX.Element {
  return (
    <Provider>
      <div className={styles.root}>
        <SidewaysNavigation className={styles.root__nav}>
          <SidewaysNavLink to={{ pathname: '/', state: { target: 'info' } }}>
            about
          </SidewaysNavLink>
          <SidewaysNavLink to={{ pathname: '/', state: { target: 'contact' } }}>
            contact
          </SidewaysNavLink>
        </SidewaysNavigation>
        <div className={styles.root__body}>
          <div className={styles.root__content}>
            Content here
          </div>
          <div className={styles.root__info}>
            Info here
          </div>
        </div>
      </div>
    </Provider>
  );
}
