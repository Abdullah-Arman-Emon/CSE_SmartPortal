import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const HeroScene = lazy(() => import("./HeroScene"));

function webglAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Lazy 3D hero backdrop. Renders nothing under prefers-reduced-motion or
 * without WebGL (the .mesh-bg gradient behind it stays visible either way).
 * Pauses the render loop when the hero is off-screen or the tab is hidden.
 */
export default function HeroCanvas() {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (!reduce && webglAvailable()) setEnabled(true);
  }, [reduce]);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(ref.current);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Suspense fallback={null}>
        <HeroScene active={visible && tabVisible} />
      </Suspense>
    </motion.div>
  );
}
