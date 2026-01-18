import { get } from "svelte/store";
import { scaleFactor } from "../routes/clickgui/clickgui_store";

/**
 * Svelte action to apply the Fluent Reveal effect to an element.
 * It tracks the mouse position and updates CSS variables for hover and click effects.
 */
export function reveal(node: HTMLElement) {
  let clickStartTime = 0;
  let mouseUpTime = 0;
  let animationFrame: number | null = null;
  let isMouseDown = false;

  const updatePosition = (e: MouseEvent) => {
    const rect = node.getBoundingClientRect();
    const sf = get(scaleFactor);

    const x = (e.clientX - rect.left) * (2 / sf);
    const y = (e.clientY - rect.top) * (2 / sf);

    node.style.setProperty("--mouse-x", `${x}px`);
    node.style.setProperty("--mouse-y", `${y}px`);
    return { x, y };
  };

  const handleMouseMove = (e: MouseEvent) => {
    updatePosition(e);
  };

  const animate = () => {
    const now = Date.now();
    const elapsed = now - clickStartTime;
    const sizeDuration = 600;
    const fadeDuration = 400;

    // Calculate size progress (0 to 1)
    const sizeProgress = Math.min(1, elapsed / sizeDuration);
    const easeOut = 1 - Math.pow(1 - sizeProgress, 3);
    const size = easeOut * 200;
    node.style.setProperty("--click-size", `${size}px`);

    // Calculate intensity
    let intensity = 0;
    if (isMouseDown) {
      intensity = 1;
    } else {
      const timeSinceUp = now - mouseUpTime;
      intensity = Math.max(0, 1 - timeSinceUp / fadeDuration);
    }
    node.style.setProperty("--click-intensity", intensity.toString());

    // Continue animation if size is still growing, or if mouse is down, or if we are fading out
    if (sizeProgress < 1 || isMouseDown || intensity > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    const { x, y } = updatePosition(e);
    isMouseDown = true;
    clickStartTime = Date.now();
    mouseUpTime = 0;

    node.style.setProperty("--click-x", `${x}px`);
    node.style.setProperty("--click-y", `${y}px`);
    node.style.setProperty("--click-intensity", "1");
    node.style.setProperty("--click-size", "0px");

    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animate();
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    mouseUpTime = Date.now();

    // If the animation loop isn't running, start it to handle the fade out
    if (animationFrame === null) {
      animate();
    }
  };

  node.addEventListener("mousemove", handleMouseMove);
  node.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    },
  };
}
