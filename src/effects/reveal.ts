import { get } from "svelte/store";
import { scaleFactor } from "../routes/clickgui/clickgui_store";

/**
 * Svelte action to apply the Fluent Reveal effect to an element.
 * It tracks the mouse position and updates CSS variables --mouse-x and --mouse-y.
 */
export function reveal(node: HTMLElement) {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    const sf = get(scaleFactor);

    // Calculate position relative to the element, accounting for the UI scale factor
    const x = (e.clientX - rect.left) * (2 / sf);
    const y = (e.clientY - rect.top) * (2 / sf);

    node.style.setProperty("--mouse-x", `${x}px`);
    node.style.setProperty("--mouse-y", `${y}px`);
  };

  node.addEventListener("mousemove", handleMouseMove);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMouseMove);
    },
  };
}
