import * as React from 'react';
import * as styles from './App.module.scss';
import { Provider } from './components/Provider';
import { ILandmark, LandmarkContext, LandmarkRegistry } from './components/Landmark/Registry';
import { SidewaysNavigation, SidewaysNavLink } from './components/Navigation/SidewaysNavigation';

type Landmarks = {
  navigation: ILandmark | null;
  skipHeader: ILandmark | null;
  body: ILandmark | null;
}

export function App(): JSX.Element {
  const [rendered, setRendered] = React.useState(false);

  React.useEffect(() => {
    setRendered(true);

    return () => {
      setRendered(false);
    };
  }, [setRendered]);

  const [landmarks, setLandmarks] = React.useState<LandmarkRegistry>({
    navigation: null,
    skipHeader: null,
    body: null,
  } as Landmarks);

  const landmarkRegister = (key: keyof typeof landmarks, value: ILandmark) => {
    if (!landmarks[key]) {
      setLandmarks((lm) => ({
        ...lm,
        [key]: value,
      }));
    }
  };

  return (
    <Provider>
      <LandmarkContext.Provider value={landmarkRegister}>
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
              <div className={styles.root__portal}>
                Info here
              </div>
            </div>
          </div>
          {rendered ? (
            <div className={styles.root__navigateContent}>
              Navigate to main content
            </div>
          ) : null}
        </div>
      </LandmarkContext.Provider>
    </Provider>
  );
}
