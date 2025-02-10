const revealConfig = {
  lightColor: 'rgba(255, 255, 255, 0.1)',
  gradientSize: '100px',
  clickEffect: {
    size: '100px',
    duration: 1000,
    speed: 2
  }
};

// Declare the custom property on HTMLElement
declare global {
  interface HTMLElement {
    _hasRevealEffect?: boolean;
    _hoverGradient?: string;
    _clickAnimation?: number;
  }
}

function getRelativePos(element: HTMLElement, event: MouseEvent): [number, number] {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return [x, y];
}

function createGradient(x: number, y: number, size: string): string {
  return `radial-gradient(circle ${size} at ${x}px ${y}px, ${revealConfig.lightColor}, transparent)`;
}

function createClickGradient(x: number, y: number, size: number, opacity: number): string {
  return `radial-gradient(circle ${size}px at ${x}px ${y}px, transparent, color-mix(in srgb, ${revealConfig.lightColor}, transparent ${opacity * 100}%), transparent)`;
}
export function applyRevealEffect(element: HTMLElement): void {
  if (element._hasRevealEffect) return;

  let isHovering = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Ensure custom properties for hover and click effects are reset as needed
  const originalBg = element.style.backgroundImage;

  element.addEventListener('mouseenter', (e) => {
    isHovering = true;
    updateEffect(e);
  });
  element.addEventListener('mouseleave', () => {
    isHovering = false;
    element.style.setProperty('--mouse-x', '');
    element.style.setProperty('--mouse-y', '');
    element.style.backgroundImage = originalBg;
    (element as any)._hoverGradient = originalBg;
  });

  element.addEventListener('mousemove', (e) => {
    if (isHovering) {
      updateEffect(e);
    }
  });

  function updateEffect(e: MouseEvent): void {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only update if position changed beyond a minimal threshold
    if (Math.abs(x - lastMouseX) > 1 || Math.abs(y - lastMouseY) > 1) {
      lastMouseX = x;
      lastMouseY = y;

      const gradient = createGradient(x, y, revealConfig.gradientSize);
      element.style.backgroundImage = element._hoverGradient || gradient;

      // Use CSS custom properties for enhanced styling flexibility
      element.style.setProperty('--mouse-x', `${x}px`);
      element.style.setProperty('--mouse-y', `${y}px`);
    }
  }

  element.addEventListener('mousedown', (e: MouseEvent) => {
    const [x, y] = getRelativePos(element, e);
    element._hoverGradient = element.style.backgroundImage;

    let startTime: number | undefined;
    const duration = revealConfig.clickEffect.duration;
    const speed = revealConfig.clickEffect.speed;
    const maxSize = duration * speed;
    const size = parseInt(revealConfig.clickEffect.size);

    function animate(timestamp: number): void {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;

      if (progress < 1) {
        const currentSize = maxSize * progress + size;
        element.style.backgroundImage =
          (element._hoverGradient || originalBg) +
          ', ' +
          createClickGradient(x, y, currentSize, 1 - progress);
        element._clickAnimation = requestAnimationFrame(animate);
      } else {
        element.style.backgroundImage = element._hoverGradient || originalBg;
        cancelAnimationFrame(element._clickAnimation!);
        element._clickAnimation = undefined;
      }
    }

    if (element._clickAnimation) {
      cancelAnimationFrame(element._clickAnimation);
    }
    element._clickAnimation = requestAnimationFrame(animate);
  });

  element._hasRevealEffect = true;
}