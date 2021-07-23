import * as React from 'react';
import classNames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';
import * as styles from './SidewaysNavigation.module.scss'

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
  return (
    <span className={styles.root__linkContainer}>
      <Link to={to} className={classNames(styles.root__link, className)}>
        {children}
      </Link>
    </span>
  );
}
