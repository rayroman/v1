import * as React from 'react';
import classNames from 'classnames';
import * as styles from './App.module.scss';
import { Title } from './components/Title';

export function App(): JSX.Element {
  return (
    <div className={styles.root}>
      <Title className={styles.root__title}>
        Ray Roman
      </Title>
    </div>
  );
}
