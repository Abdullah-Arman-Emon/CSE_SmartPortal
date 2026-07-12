import { motion, useReducedMotion } from "framer-motion";

/**
 * Glass surface card with hover lift + glow. Use on dark (`.mesh-bg`) bands.
 * `interactive={false}` renders a static glass panel.
 */
export default function GlassCard({
  children,
  className = "",
  interactive = true,
  ...rest
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`glass rounded-2xl ${className}`}
      whileHover={
        interactive && !reduce
          ? {
              y: -4,
              boxShadow: "0 0 40px -12px rgba(79,107,255,0.55)",
              borderColor: "rgba(147,165,255,0.35)",
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
