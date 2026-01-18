import { get } from "svelte/store";
import { scaleFactor } from "../routes/clickgui/clickgui_store";

/**
 * Svelte action to apply the Fluent Reveal effect to an element.
 * It tracks the mouse position and updates CSS variables for hover, click, and border effects.
 */
export function reveal(node: HTMLElement) {
  let clickStartTime = 0;
  let mouseUpTime = 0;
  let animationFrame: number | null = null;
  let isMouseDown = false;
  let rect = node.getBoundingClientRect();

  const updateRect = () => {
    rect = node.getBoundingClientRect();
  };

  const updatePosition = (e: MouseEvent) => {
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
    const fadeDuration = 200;

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
    updateRect();
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

  const handleMouseEnter = () => {
    updateRect();
  };

  node.addEventListener("mousemove", handleMouseMove);
  node.addEventListener("mousedown", handleMouseDown);
  node.addEventListener("mouseenter", handleMouseEnter);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("scroll", updateRect, true);
  window.addEventListener("resize", updateRect);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMouseMove);
      node.removeEventListener("mousedown", handleMouseDown);
      node.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    },
  };
}
