import * as React from 'react';
import {
  FocusMonitor,
  FocusMonitorOptions,
} from './FocusMonitor';
import { PlatformContext } from '../Platform';
import { IFocusMonitor } from './types';

/**
 * Context that is used *in the provider* as a singleton for the rest of the app.
 * Most components will not need this directly.
 */
export function useFocusMonitorContext(options?: FocusMonitorOptions): IFocusMonitor {
  const platform = React.useContext(PlatformContext);
  const monitor = React.useRef(new FocusMonitor(platform, options));

  React.useEffect(() => () => monitor.current.unmount(), []);

  return monitor.current;
}
