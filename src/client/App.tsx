import * as React from 'react';
import * as styles from './App.module.scss';
import { Title } from './components/Title';
import { Platform } from './components/Platform';

export function App(): JSX.Element {
  return (
    <Platform>
      <div className={styles.root}>
        <Title className={styles.root__title}>
          Hello, world
        </Title>
      </div>
    </Platform>
  );
}
