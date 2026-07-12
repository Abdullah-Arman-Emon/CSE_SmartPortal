import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "framer-motion";

/**
 * Count-up number that starts when scrolled into view.
 * Accepts values like 1200, "1200+", "95%" — animates the numeric part and
 * keeps the suffix. Jumps straight to the final value under reduced motion.
 */
export default function AnimatedCounter({ value, duration = 1.6, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  const str = String(value ?? "");
  const match = str.match(/^([^\d]*)([\d,.]+)(.*)$/);
  const prefix = match ? match[1] : "";
  const target = match ? parseFloat(match[2].replace(/,/g, "")) : 0;
  const suffix = match ? match[3] : str;

  const [display, setDisplay] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || !match) return;
    if (reduce) {
      setDisplay(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return <span className={className}>{str}</span>;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
