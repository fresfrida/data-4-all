import { useEffect, useRef, useState } from "react";

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

/**
 * Animates a number from 0 up to `target` the first time the returned ref's
 * element scrolls into view. Skips the animation (shows the real value at
 * once) for visitors who prefer reduced motion.
 *
 * @returns {[React.RefObject<HTMLElement>, number]}
 */
export function useCountUp(target, durationMs = 1400) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return undefined;
    }

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / durationMs, 1);
        setValue(Math.round(target * easeOutCubic(progress)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target, durationMs]);

  return [ref, value];
}
