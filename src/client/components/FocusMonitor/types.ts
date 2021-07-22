import { CallbackWithId } from '../util';

export type FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null;
export type FocusMonitorListener = CallbackWithId<(origin: FocusOrigin) => void>;
/**
 * Options to be passed into the `monitor` method.
 */
export type MonitoringOptions = {
  listener: FocusMonitorListener;
  checkChildren?: boolean;
};

/**
 * Corresponds to the options that can be passed to the native `focus` event.
 * via https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
 */
export interface FocusOptions {
  /** Whether the browser should scroll to the element when it is focused. */
  preventScroll?: boolean;
}

export interface IFocusMonitor {
  monitor(element: HTMLElement, options: MonitoringOptions): () => void;
  stopMonitoring(element: HTMLElement): void;
  focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void;
}
