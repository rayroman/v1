/**
 * Code copied from Angular Material
 */

let shadowDomIsSupported: boolean;

/** Checks whether the user's browser support Shadow DOM. */
export function supportsShadowDom(): boolean {
  if (shadowDomIsSupported == null) {
    const head = typeof document !== 'undefined' ? document.head : null;
    shadowDomIsSupported = !!(head && ((head as any).createShadowRoot || head.attachShadow));
  }

  return shadowDomIsSupported;
}

/** Gets the shadow root of an element, if supported and the element is inside the Shadow DOM. */
export function getShadowRoot(element: HTMLElement): ShadowRoot | null {
  if (supportsShadowDom()) {
    const rootNode = element.getRootNode ? element.getRootNode() : null;

    // Note that this should be caught by `supportsShadowDom`, but some
    // teams have been able to hit this code path on unsupported browsers.
    if (typeof ShadowRoot !== 'undefined' && ShadowRoot && rootNode instanceof ShadowRoot) {
      return rootNode;
    }
  }

  return null;
}
