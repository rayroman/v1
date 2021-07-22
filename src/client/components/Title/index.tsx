import * as React from 'react';
import classNames from 'classnames';
import * as styles from './index.module.scss';

type TitleProps = {
  className?: string;
  children: React.ReactNode;
};

export function Title(props: TitleProps): JSX.Element {
  const { className, children } = props;
  return (
    <h1 className={classNames(styles.root, className)}>{children}</h1>
  )
}
