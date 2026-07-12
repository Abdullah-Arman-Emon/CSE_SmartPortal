import { motion, useReducedMotion } from "framer-motion";
import { viewportOnce, EASE } from "../motion/motion";

/**
 * Eyebrow + heading + optional sub with an animated underline bar.
 * `dark` flips text colors for use on navy bands.
 */
export default function SectionHeading({
  eyebrow,
  title,
  sub,
  dark = false,
  align = "center",
  className = "",
}) {
  const reduce = useReducedMotion();
  const alignCls =
    align === "left" ? "text-left items-start" : "text-center items-center";

  return (
    <motion.div
      className={`flex flex-col gap-3 ${alignCls} ${className}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-500">
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display text-3xl md:text-4xl font-bold tracking-tight ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      <motion.span
        className="h-1 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-brand-500"
        style={{ originX: align === "left" ? 0 : 0.5 }}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
      />
      {sub && (
        <p
          className={`max-w-2xl text-base md:text-lg ${
            dark ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );
}
