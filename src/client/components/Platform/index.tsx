import * as React from 'react';

// Code copied from Angular Material, adapted for React

// Whether the current platform supports the V8 Break Iterator. The V8 check
// is necessary to detect all Blink based browsers.
let hasV8BreakIterator: boolean;

// We need a try/catch around the reference to `Intl`, because accessing it in some cases can
// cause IE to throw. These cases are tied to particular versions of Windows and can happen if
// the consumer is providing a polyfilled `Map`. See:
// https://github.com/Microsoft/ChakraCore/issues/3189
// https://github.com/angular/components/issues/15687
try {
  hasV8BreakIterator = (typeof Intl !== 'undefined' && (Intl as any).v8BreakIterator);
} catch {
  hasV8BreakIterator = false;
}

export interface IPlatform {
  BROWSER: boolean;
  EDGE: boolean;
  TRIDENT: boolean;
  BLINK: boolean;
  WEBKIT: boolean;
  IOS: boolean;
  FIREFOX: boolean;
  ANDROID: boolean;
  SAFARI: boolean;
}

export const PlatformContext = React.createContext<IPlatform>({
  /** Whether we're in the browser */
  BROWSER: false,
  /** Whether the current browser is Microsoft Edge. */
  EDGE: false,
  /** Whether the current rendering engine is Microsoft Trident. */
  TRIDENT: false,
  // EdgeHTML and Trident mock Blink specific things and need to be excluded from this check.
  /** Whether the current rendering engine is Blink. */
  BLINK: false,
  // Webkit is part of the userAgent in EdgeHTML, Blink and Trident. Therefore we need to
  // ensure that Webkit runs standalone and is not used as another engine's base.
  /** Whether the current rendering engine is WebKit. */
  WEBKIT: false,
  /** Whether the current platform is Apple iOS. */
  IOS: false,
  // It's difficult to detect the plain Gecko engine, because most of the browsers identify
  // them self as Gecko-like browsers and modify the userAgent's according to that.
  // Since we only cover one explicit Firefox case, we can simply check for Firefox
  // instead of having an unstable check for Gecko.
  /** Whether the current browser is Firefox. */
  FIREFOX: false,
  /** Whether the current platform is Android. */
  // Trident on mobile adds the android platform to the userAgent to trick detections.
  ANDROID: false,
  // Safari browsers will include the Safari keyword in their userAgent. Some browsers may fake
  // this and just place the Safari keyword in the userAgent. To be more safe about Safari every
  // Safari browser should also use Webkit as its layout engine.
  /** Whether the current browser is Safari. */
  SAFARI: false,
});

export class Platform implements IPlatform {
  readonly BROWSER: boolean;
  readonly EDGE: boolean;
  readonly TRIDENT: boolean;
  readonly BLINK: boolean;
  readonly WEBKIT: boolean;
  readonly IOS: boolean;
  readonly FIREFOX: boolean;
  readonly ANDROID: boolean;
  readonly SAFARI: boolean;

  constructor() {
    const isBrowser = typeof document === 'object' && !!document;
    const isEdge = isBrowser && /(edge)/i.test(navigator.userAgent);
    const isTrident = isBrowser && /(msie|trident)/i.test(navigator.userAgent);
    const isBlink = isBrowser && (!!((window as any).chrome || hasV8BreakIterator) &&
      typeof CSS !== 'undefined' && !isEdge && !isTrident);
    const isWebkit = isBrowser &&
      /AppleWebKit/i.test(navigator.userAgent) && !isBrowser && !isEdge && !isTrident;

    this.BROWSER = isBrowser;
    this.EDGE = isEdge;
    this.TRIDENT = isTrident;
    this.BLINK = isBlink;
    this.WEBKIT = isWebkit;
    this.IOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !('MSStream' in window);
    this.FIREFOX = isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
    this.ANDROID = isBrowser && /android/i.test(navigator.userAgent) && !isTrident;
    this.SAFARI = isBrowser && /safari/i.test(navigator.userAgent) && isWebkit;
  }
}
