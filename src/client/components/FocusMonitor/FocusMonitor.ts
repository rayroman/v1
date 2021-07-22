import { FocusMonitorListener, FocusOptions, FocusOrigin, IFocusMonitor, MonitoringOptions } from './types';
import { IHasLifecycle } from '../util';
import { normalizePassiveListenerOptions } from '../Platform/passiveEventListeners';
import { isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader } from '../Platform/fakeEventDetection';
import { IPlatform } from '../Platform';
import { getShadowRoot } from '../Platform/shadowDom';

const noop = () => undefined;

type MonitoredElementInfo = {
  checkChildren: boolean;
  callbacks: FocusMonitorListener[];
  rootNode: HTMLElement | ShadowRoot | Document;
};

export enum FocusMonitorDetectionMode {
  /**
   * Any mousedown, keydown, or touchstart event that happened in the previous
   * tick or the current tick will be used to assign a focus event's origin (to
   * either mouse, keyboard, or touch). This is the default option.
   */
  IMMEDIATE,
  /**
   * A focus event's origin is always attributed to the last corresponding
   * mousedown, keydown, or touchstart event, no matter how long ago it occured.
   */
  EVENTUAL,
}

/** Options for FocusMonitor. These are passed in the root provider */
export interface FocusMonitorOptions {
  detectionMode?: FocusMonitorDetectionMode;
}

export const TOUCH_BUFFER_MS = 650;

/** Gets the target of an event, accounting for Shadow DOM. */
function getTarget(event: Event): HTMLElement | null {
  // If an event is bound outside the Shadow DOM, the `event.target` will
  // point to the shadow root so we have to use `composedPath` instead.
  return (event.composedPath ? event.composedPath()[0] : event.target) as HTMLElement | null;
}

/**
 * Event listener options that enable capturing and also
 * mark the listener as passive if the browser supports it.
 */
const captureEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true,
});

export class FocusMonitor implements IFocusMonitor, IHasLifecycle {
  /** The focus origin that the next focus event is a result of. */
  private origin: FocusOrigin = null;

  /** The FocusOrigin of the last focus event tracked by the FocusMonitor. */
  private lastFocusOrigin: FocusOrigin = null;

  /** Whether the window has just been focused. */
  private windowFocused = false;

  /** The target of the last touch event. */
  private lastTouchTarget: EventTarget | null = null;

  /** The timeout id of the touch timeout, used to cancel timeout later. */
  private touchTimeoutId!: number;

  /** The timeout id of the window focus timeout. */
  private windowFocusTimeoutId!: number;

  /** The timeout id of the origin clearing timeout. */
  private originTimeoutId!: number;

  /** Map of elements being monitored to their info. */
  private elementInfo = new Map<HTMLElement, MonitoredElementInfo>();

  /** The number of elements currently being monitored. */
  private monitoredElementCount = 0;

  /**
   * Keeps track of the root nodes to which we've currently bound a focus/blur handler,
   * as well as the number of monitored elements that they contain. We have to treat focus/blur
   * handlers differently from the rest of the events, because the browser won't emit events
   * to the document when focus moves inside of a shadow root.
   */
  private rootNodeFocusListenerCount = new Map<HTMLElement | Document | ShadowRoot, number>();

  /**
   * The specified detection mode, used for attributing the origin of a focus
   * event.
   */
  private readonly detectionMode: FocusMonitorDetectionMode;

  /**
   * Internal platform
   */
  private readonly platform: IPlatform;

  /**
   * Event listener for `keydown` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  private documentKeydownListener = () => {
    // On keydown record the origin and clear any touch event that may be in progress.
    this.lastTouchTarget = null;
    this.setOriginForCurrentEventQueue('keyboard');
  };

  /**
   * Event listener for `mousedown` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  private documentMousedownListener = (event: MouseEvent) => {
    // On mousedown record the origin only if there is not touch
    // target, since a mousedown can happen as a result of a touch event.
    if (!this.lastTouchTarget) {
      // In some cases screen readers fire fake `mousedown` events instead of `keydown`.
      // Resolve the focus source to `keyboard` if we detect one of them.
      const source = isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse';
      this.setOriginForCurrentEventQueue(source);
    }
  };

  /**
   * Event listener for `touchstart` events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  private documentTouchstartListener = (event: TouchEvent) => {
    // Some screen readers will fire a fake `touchstart` event if an element is activated using
    // the keyboard while on a device with a touchscreen. Consider such events as keyboard focus.
    if (!isFakeTouchstartFromScreenReader(event)) {
      // When the touchstart event fires the focus event is not yet in the event queue. This means
      // we can't rely on the trick used above (setting timeout of 1ms). Instead we wait 650ms to
      // see if a focus happens.
      if (this.touchTimeoutId != null) {
        window.clearTimeout(this.touchTimeoutId);
      }

      this.lastTouchTarget = getTarget(event);
      this.touchTimeoutId = window.setTimeout(() => {
        this.lastTouchTarget = null;
      }, TOUCH_BUFFER_MS);
    } else if (!this.lastTouchTarget) {
      this.setOriginForCurrentEventQueue('keyboard');
    }
  };

  /**
   * Event listener for `focus` events on the window.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  private windowFocusListener = () => {
    // Make a note of when the window regains focus, so we can
    // restore the origin info for the focused element.
    this.windowFocused = true;
    this.windowFocusTimeoutId = window.setTimeout(() => {
      this.windowFocused = false;
    });
  };

  /**
   * Event listener for `focus` and 'blur' events on the document.
   * Needs to be an arrow function in order to preserve the context when it gets bound.
   */
  private rootNodeFocusAndBlurListener = (event: Event) => {
    const target = getTarget(event);
    const handler = event.type === 'focus' ? this.onFocus : this.onBlur;

    // We need to walk up the ancestor chain in order to support `checkChildren`.
    for (let element = target; element; element = element.parentElement) {
      handler.call(this, event as FocusEvent, element);
    }
  };

  constructor(platform: IPlatform, options?: FocusMonitorOptions) {
    this.platform = platform;
    this.detectionMode = (options || {}).detectionMode || FocusMonitorDetectionMode.IMMEDIATE;
  }

  /**
   * Monitors focus on an element and applies appropriate CSS classes.
   * @param element The element to monitor
   * @param options Includes the callback for detecting focus change
   */
  monitor(element: HTMLElement, options: MonitoringOptions): () => void {
    // Do nothing if we're not on the browser platform or the passed in node isn't an element.
    if (!this.platform.BROWSER || element.nodeType !== 1) {
      return noop;
    }

    const rootNode = getShadowRoot(element) || window.document;
    const existingInfo = this.elementInfo.get(element);

    if (existingInfo) {
      if (options.checkChildren) {
        existingInfo.checkChildren = true;
      }

      const callbacks = existingInfo.callbacks;
      const listenerId = options.listener.id;
      if (callbacks) {
        const existingListener = callbacks.find((listener) => listener.id === listenerId);

        // If the listener exists, and the saved listener callback is different from the one
        // we're passing as an argument, then overwrite it.
        if (existingListener) {
          if (existingListener.callback !== options.listener.callback) {
            existingListener.callback = options.listener.callback;
          }
        } else {
          // Otherwise, the listener doesn't exist, so we push the listener in the array.
          existingInfo.callbacks.push(options.listener);
        }
      }

      // Return an unsubscribe function to clear the listener.
      return this.unsubscribeListener.bind(this, element, listenerId);
    }

    const info: MonitoredElementInfo = {
      rootNode,
      checkChildren: options.checkChildren || false,
      callbacks: [options.listener],
    };

    this.elementInfo.set(element, info);
    this.registerGlobalListeners(info);

    return this.unsubscribeListener.bind(this, element, options.listener.id);
  }

  /**
   * Stops monitoring an element and removes all focus classes.
   * @param element The element to stop monitoring.
   */
  stopMonitoring(element: HTMLElement): void {
    const elementInfo = this.elementInfo.get(element);

    if (elementInfo) {
      this.elementInfo.delete(element);
      this.removeGlobalListeners(elementInfo);
    }
  }

  /**
   * Focuses the element via the specified focus origin.
   * @param element Element to focus.
   * @param origin Focus origin.
   * @param options Options that can be used to configure the focus behavior.
   */
  focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void {
    const focusedElement = window.document.activeElement;

    // If the element is focused already, calling `focus` again won't trigger the event listener
    // which means that the focus classes won't be updated. If that's the case, update the classes
    // directly without waiting for an event.
    if (element === focusedElement) {
      this.getClosestElementsInfo(element).forEach(([currentElement, info]) =>
        this.originChanged(currentElement, origin, info),
      );
    } else {
      this.setOriginForCurrentEventQueue(origin);

      // `focus` isn't available on the server
      if (typeof element.focus === 'function') {
        element.focus(options);
      }
    }
  }

  unmount(): void {
    this.elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }

  private unsubscribeListener(element: HTMLElement, listenerId: string): void {
    const targetInfo = this.elementInfo.get(element);
    if (targetInfo) {
      const targetCallbackIndex = targetInfo.callbacks.findIndex(
        (listener) => listener.id === listenerId,
      );
      if (targetCallbackIndex > -1) {
        targetInfo.callbacks.splice(targetCallbackIndex, 1);
      }
    }
  }

  private getFocusOrigin(event: FocusEvent): FocusOrigin {
    // If we couldn't detect a cause for the focus event, it's due to one of three reasons:
    // 1) The window has just regained focus, in which case we want to restore the focused state of
    //    the element from before the window blurred.
    // 2) It was caused by a touch event, in which case we mark the origin as 'touch'.
    // 3) The element was programmatically focused, in which case we should mark the origin as
    //    'program'.
    if (this.origin) {
      return this.origin;
    }

    if (this.windowFocused && this.lastFocusOrigin) {
      return this.lastFocusOrigin;
    } else if (this.wasCausedByTouch(event)) {
      return 'touch';
    } else {
      return 'program';
    }
  }

  /**
   * Sets the origin and schedules an async function to clear it at the end of the event queue.
   * If the detection mode is 'eventual', the origin is never cleared.
   * @param origin The origin to set.
   */
  private setOriginForCurrentEventQueue(origin: FocusOrigin): void {
    this.origin = origin;

    if (this.detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
      // Sometimes the focus origin won't be valid in Firefox because Firefox seems to focus *one*
      // tick after the interaction event fired. To ensure the focus origin is always correct,
      // the focus origin will be determined at the beginning of the next tick.
      this.originTimeoutId = window.setTimeout(() => (this.origin = null), 1);
    }
  }

  /**
   * Checks whether the given focus event was caused by a touchstart event.
   * @param event The focus event to check.
   * @returns Whether the event was caused by a touch.
   */
  private wasCausedByTouch(event: FocusEvent): boolean {
    const focusTarget = getTarget(event);
    return (
      this.lastTouchTarget instanceof Node &&
      focusTarget instanceof Node &&
      (focusTarget === this.lastTouchTarget || focusTarget.contains(this.lastTouchTarget))
    );
  }

  /**
   * Handles focus events on a registered element.
   * @param event The focus event.
   * @param element The monitored element.
   */
  onFocus(event: FocusEvent, element: HTMLElement): void {
    // NOTE(mmalerba): We currently set the classes based on the focus origin of the most recent
    // focus event affecting the monitored element. If we want to use the origin of the first event
    // instead we should check for the cdk-focused class here and return if the element already has
    // it. (This only matters for elements that have includesChildren = true).

    // If we are not counting child-element-focus as focused, make sure that the event target is the
    // monitored element itself.
    const elementInfo = this.elementInfo.get(element);
    if (!elementInfo || (!elementInfo.checkChildren && element !== getTarget(event))) {
      return;
    }

    this.originChanged(element, this.getFocusOrigin(event), elementInfo);
  }

  /**
   * Handles blur events on a registered element.
   * @param event The blur event.
   * @param element The monitored element.
   */
  onBlur(event: FocusEvent, element: HTMLElement): void {
    // If we are counting child-element-focus as focused, make sure that we aren't just blurring in
    // order to focus another child of the monitored element.
    const elementInfo = this.elementInfo.get(element);

    if (
      !elementInfo ||
      (elementInfo.checkChildren &&
        event.relatedTarget instanceof Node &&
        element.contains(event.relatedTarget))
    ) {
      return;
    }

    const callbacks = elementInfo.callbacks;
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i].callback(null);
    }
  }

  private registerGlobalListeners(elementInfo: MonitoredElementInfo) {
    if (!this.platform.BROWSER) {
      return;
    }

    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this.rootNodeFocusListenerCount.get(rootNode) || 0;

    if (!rootNodeFocusListeners) {
      rootNode.addEventListener(
        'focus',
        this.rootNodeFocusAndBlurListener,
        captureEventListenerOptions,
      );
      rootNode.addEventListener(
        'blur',
        this.rootNodeFocusAndBlurListener,
        captureEventListenerOptions,
      );
    }

    this.rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);

    // Register global listeners when first element is monitored.
    this.monitoredElementCount = this.monitoredElementCount + 1;
    if (this.monitoredElementCount === 1) {
      // Note: we listen to events in the capture phase so we
      // can detect them even if the user stops propagation.
      document.addEventListener(
        'keydown',
        this.documentKeydownListener,
        captureEventListenerOptions,
      );
      document.addEventListener(
        'mousedown',
        this.documentMousedownListener,
        captureEventListenerOptions,
      );
      document.addEventListener(
        'touchstart',
        this.documentTouchstartListener,
        captureEventListenerOptions,
      );
      window.addEventListener('focus', this.windowFocusListener);
    }
  }

  private removeGlobalListeners(elementInfo: MonitoredElementInfo): void {
    const rootNode = elementInfo.rootNode;

    if (this.rootNodeFocusListenerCount.has(rootNode)) {
      const rootNodeFocusListeners = this.rootNodeFocusListenerCount.get(rootNode);

      if (rootNodeFocusListeners != null) {
        if (rootNodeFocusListeners > 1) {
          this.rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners - 1);
        } else {
          rootNode.removeEventListener(
            'focus',
            this.rootNodeFocusAndBlurListener,
            captureEventListenerOptions,
          );
          rootNode.removeEventListener(
            'blur',
            this.rootNodeFocusAndBlurListener,
            captureEventListenerOptions,
          );
          this.rootNodeFocusListenerCount.delete(rootNode);
        }
      }
    }

    // Unregister global listeners when last element is unmonitored.
    this.monitoredElementCount = this.monitoredElementCount - 1;
    if (!this.monitoredElementCount) {
      document.removeEventListener(
        'keydown',
        this.documentKeydownListener,
        captureEventListenerOptions,
      );
      document.removeEventListener(
        'mousedown',
        this.documentMousedownListener,
        captureEventListenerOptions,
      );
      document.removeEventListener(
        'touchstart',
        this.documentTouchstartListener,
        captureEventListenerOptions,
      );
      window.removeEventListener('focus', this.windowFocusListener);

      // Clear timeouts for all potentially pending timeouts to prevent leaks.
      window.clearTimeout(this.windowFocusTimeoutId);
      window.clearTimeout(this.touchTimeoutId);
      window.clearTimeout(this.originTimeoutId);
    }
  }

  /** Updates all the state on an element once its focus origin has changed. */
  private originChanged(
    element: HTMLElement,
    origin: FocusOrigin,
    elementInfo: MonitoredElementInfo,
  ) {
    const callbacks = elementInfo.callbacks;
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i].callback(origin);
    }
    this.lastFocusOrigin = origin;
  }

  /**
   * Collects the `MonitoredElementInfo` of a particular element and
   * all of its ancestors that have enabled `checkChildren`.
   * @param element Element from which to start the search.
   */
  private getClosestElementsInfo(element: HTMLElement): [HTMLElement, MonitoredElementInfo][] {
    const results: [HTMLElement, MonitoredElementInfo][] = [];

    this.elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
        results.push([currentElement, info]);
      }
    });

    return results;
  }
}
