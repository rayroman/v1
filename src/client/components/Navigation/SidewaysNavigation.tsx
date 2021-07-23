import * as React from 'react';
import classNames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';
import * as styles from './SidewaysNavigation.module.scss'
import { ProviderContext } from '../Provider';
import { FocusOrigin } from '../FocusMonitor/types';

type SidewaysNavigationProps = {
  className?: string;
  children?: React.ReactNode;
};

export function SidewaysNavigation(props: SidewaysNavigationProps): JSX.Element {
  const { className, children } = props;

  return (
    <nav className={classNames(styles.root, className)}>
      <div className={styles.root__container}>
        {children}
      </div>
    </nav>
  );
}

type LinkScrollState = {
  target: string;
}

export function SidewaysNavLink(props: LinkProps<LinkScrollState>): JSX.Element {
  const { children, to, className } = props;

  const provider = React.useContext(ProviderContext);
  const [focusOrigin, setFocusOrigin] = React.useState<FocusOrigin>(null);

  const unmonitor = React.useRef<() => void>(() => undefined);

  const setLink = (anchor: HTMLAnchorElement | null) => {
    if (provider && anchor) {
      unmonitor.current = provider.focusMonitor.monitor(anchor, {
        checkChildren: true,
        listener: {
          id: 'nav-link',
          callback: setFocusOrigin,
        }
      });
    }
  };

  React.useEffect(() => {
    return () => {
      unmonitor.current();
    }
  }, []);

  return (
    <span className={styles.root__linkContainer}>
      <Link
        to={to}
        className={
          classNames(
            styles.root__link,
            {
              [styles.root__linkFocused]: focusOrigin != null,
              [styles.root__linkKeyboard]: focusOrigin === 'keyboard',
            },
            className,
          )
        }
        ref={setLink}
      >
        {children}
      </Link>
    </span>
  );
}
