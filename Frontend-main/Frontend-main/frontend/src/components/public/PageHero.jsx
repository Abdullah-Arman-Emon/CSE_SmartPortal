import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { staggerContainer, fadeUp } from "../motion/motion";

/**
 * Shared inner-page hero band (mesh gradient + breadcrumb + title/sub +
 * optional stat chips / extra content). Replaces the per-page slate bands.
 */
export default function PageHero({ eyebrow, title, sub, crumbs = [], stats, children }) {
  const reduce = useReducedMotion();

  return (
    <section className="mesh-bg relative overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:28px_28px]" />
      <motion.div
        className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 md:pb-20 md:pt-32"
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        animate="visible"
      >
        {crumbs.length > 0 && (
          <motion.nav
            variants={fadeUp}
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-400"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="hover:text-cyan-300">
              Home
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5" />
                {c.href ? (
                  <Link to={c.href} className="hover:text-cyan-300">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-200">{c.label}</span>
                )}
              </span>
            ))}
          </motion.nav>
        )}
        {eyebrow && (
          <motion.span
            variants={fadeUp}
            className="mb-3 block text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          variants={fadeUp}
          className="font-display max-w-3xl text-4xl font-bold tracking-tight md:text-5xl"
        >
          {title}
        </motion.h1>
        {sub && (
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
            {sub}
          </motion.p>
        )}
        {stats && stats.length > 0 && (
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            {stats.map((s, i) => (
              <span
                key={i}
                className="glass rounded-full px-4 py-1.5 text-sm text-slate-200"
              >
                <span className="font-semibold text-cyan-300">{s.value}</span> {s.label}
              </span>
            ))}
          </motion.div>
        )}
        {children && (
          <motion.div variants={fadeUp} className="mt-8">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
