import * as React from 'react';
import * as styles from './App.module.scss';
import { Title } from './components/Title';
import { Provider } from './components/Provider';

export function App(): JSX.Element {
  return (
    <Provider>
      <div className={styles.root}>
        <Title className={styles.root__title}>
          Hello, world
        </Title>
      </div>
    </Provider>
  );
}
