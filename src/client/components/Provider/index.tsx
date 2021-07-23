import * as React from 'react';
import { IPlatform, Platform } from '../Platform';
import { IFocusMonitor } from '../FocusMonitor/types';
import { FocusMonitor } from '../FocusMonitor/FocusMonitor';

export interface IProvider {
  platform: IPlatform;
  focusMonitor: IFocusMonitor;
}

export const ProviderContext = React.createContext<IProvider | null>(null);

/**
 * Provider component to instantiate all utils and contexts that are available
 * for components in the rest of the app.
 */
export function Provider({ children }: { children?: React.ReactNode }): JSX.Element {
  const { current: platform } = React.useRef(new Platform());
  const focusMonitor = React.useRef(new FocusMonitor(platform));

  React.useEffect(() => {
    return () => {
      focusMonitor.current.unmount();
    };
  }, []);

  return (
    <ProviderContext.Provider value={{ platform, focusMonitor: focusMonitor.current }}>
      {children}
    </ProviderContext.Provider>
  );
}
