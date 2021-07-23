import * as React from 'react';
import * as styles from './App.module.scss';
import { Provider } from './components/Provider';
import { SidewaysNavigation, SidewaysNavLink } from './components/Navigation/SidewaysNavigation';

export function App(): JSX.Element {
  const [rendered, setRendered] = React.useState(false);

  React.useEffect(() => {
    setRendered(true);

    return () => {
      setRendered(false);
    };
  }, [setRendered]);

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
        {rendered ? (
          <div>
            Navigate to main content
          </div>
        ) : null}
      </div>
    </Provider>
  );
}
