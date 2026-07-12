import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, viewportOnce } from "./motion";

/**
 * Scroll-reveal wrapper. Renders children statically when the OS asks for
 * reduced motion; otherwise animates in with `variant` when scrolled into view.
 *
 * <Reveal>...</Reveal>
 * <Reveal variant={slideLeft} delay={0.1} className="...">...</Reveal>
 */
export default function Reveal({
  children,
  variant = fadeUp,
  delay = 0,
  className,
  as = "div",
  ...rest
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduce) {
    const Static = as;
    return (
      <Static className={className} {...rest}>
        {children}
      </Static>
    );
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={variant}
      transition={delay ? { delay } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
