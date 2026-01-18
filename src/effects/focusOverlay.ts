import { writable } from "svelte/store";

export interface FocusOverlayState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  ownerId: number;
}

export interface FocusOverlayOptions {
  /**
   * Whether the overlay should only show when :focus-visible matches.
   * Defaults to true. If the browser doesn't support :focus-visible,
   * it will fall back to showing on any focus.
   */
  requireFocusVisible?: boolean;
  /**
   * One or more class names that will force the overlay to show
   * even without focus.
   */
  forceClass?: string | string[];
  /**
   * One or more attributes that will force the overlay to show
   * even without focus.
   */
  forceAttribute?: string | string[];
}

const initialState: FocusOverlayState = {
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  radius: 0,
  ownerId: 0,
};

export const focusOverlay = writable<FocusOverlayState>(initialState);

let nextOwnerId = 1;

function getBorderRadius(node: HTMLElement): number {
  const radius = getComputedStyle(node).borderRadius;
  const parsed = parseFloat(radius);
  return Number.isFinite(parsed) ? parsed : 0;
}

function updateFromNode(node: HTMLElement, ownerId: number) {
  const rect = node.getBoundingClientRect();
  focusOverlay.set({
    visible: true,
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
    radius: getBorderRadius(node),
    ownerId,
  });
}

function normalizeList(value?: string | string[]): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function supportsFocusVisibleSelector(): boolean {
  try {
    return CSS.supports("selector(:focus-visible)");
  } catch {
    return false;
  }
}

export function focusOverlayTarget(
  node: HTMLElement,
  options: FocusOverlayOptions = {},
) {
  if (typeof window === "undefined") {
    return { destroy() {} };
  }

  const requireFocusVisible = options.requireFocusVisible ?? true;
  const forceClasses = normalizeList(options.forceClass);
  const forceAttributes = normalizeList(options.forceAttribute);
  const ownerId = nextOwnerId++;

  let isFocused = false;
  let isForced = false;

  const canMatchFocusVisible = supportsFocusVisibleSelector();
  let rafId: number | null = null;

  const scheduleUpdate = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (shouldShow()) {
        updateFromNode(node, ownerId);
      }
    });
  };

  const computeForced = () => {
    const hasClass =
      forceClasses.length > 0 &&
      forceClasses.some((cls) => node.classList.contains(cls));
    const hasAttr =
      forceAttributes.length > 0 &&
      forceAttributes.some((attr) => node.hasAttribute(attr));
    isForced = hasClass || hasAttr;
  };

  const shouldShow = () => {
    if (isForced) return true;
    if (!isFocused) return false;

    if (!requireFocusVisible) {
      return true;
    }

    if (canMatchFocusVisible) {
      return node.matches(":focus-visible");
    }

    // Fallback when :focus-visible isn't supported
    return true;
  };

  const applyState = () => {
    computeForced();

    if (shouldShow()) {
      scheduleUpdate();
    } else {
      focusOverlay.update((state) =>
        state.ownerId === ownerId ? initialState : state,
      );
    }
  };

  const handleFocus = () => {
    isFocused = true;
    applyState();
  };

  const handleBlur = () => {
    isFocused = false;
    applyState();
  };

  const handleWindowChange = () => {
    if (shouldShow()) {
      scheduleUpdate();
    }
  };

  const observer = new MutationObserver(() => {
    applyState();
  });

  observer.observe(node, {
    attributes: true,
    attributeFilter: ["class", ...forceAttributes],
  });

  node.addEventListener("focusin", handleFocus);
  node.addEventListener("focusout", handleBlur);
  window.addEventListener("scroll", handleWindowChange, true);
  window.addEventListener("resize", handleWindowChange);

  // Initial state for pre-forced elements
  applyState();

  return {
    destroy() {
      node.removeEventListener("focusin", handleFocus);
      node.removeEventListener("focusout", handleBlur);
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
      observer.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      focusOverlay.update((state) =>
        state.ownerId === ownerId ? initialState : state,
      );
    },
  };
}
