import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import HeroCanvas from "../three/HeroCanvas";
import { staggerContainer, fadeUp } from "../motion/motion";

const DEFAULT_HERO = {
  title: "Shaping the Future of",
  highlight_word: "Computing",
  subtitle:
    "The Department of Computer Science and Engineering at the University of Dhaka — home of Bangladesh's brightest minds in computing since 1992.",
  badges: ["Est. 1992"],
  primary_cta: { label: "Apply for Admission", href: "/apply" },
  secondary_cta: { label: "Explore Programs", href: "/admission-hub" },
};

export default function Hero({ content }) {
  const hero = { ...DEFAULT_HERO, ...(content || {}) };
  const reduce = useReducedMotion();
  const ref = useRef(null);

  // Scroll-linked parallax: hero copy drifts up + fades as you scroll away
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} className="mesh-bg relative flex min-h-screen items-center overflow-hidden text-white">
      <HeroCanvas />
      {/* Bottom fade into the next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto w-full max-w-7xl px-4 pb-24 pt-32 sm:px-6"
      >
        <motion.div
          variants={staggerContainer(0.1, 0.15)}
          initial={reduce ? false : "hidden"}
          animate="visible"
          className="max-w-3xl"
        >
          {hero.badges?.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-2">
              {hero.badges.map((b, i) => (
                <span
                  key={i}
                  className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-cyan-200"
                >
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  {b}
                </span>
              ))}
            </motion.div>
          )}

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl"
          >
            {hero.title}{" "}
            <span className="text-aurora">{hero.highlight_word}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 max-w-2xl text-lg text-slate-300 md:text-xl">
            {hero.subtitle}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            {hero.primary_cta?.label && (
              <Link
                to={hero.primary_cta.href || "/apply"}
                className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-base font-semibold text-slate-900 shadow-xl shadow-amber-500/25 transition hover:bg-amber-400"
              >
                {hero.primary_cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {hero.secondary_cta?.label && (
              <Link
                to={hero.secondary_cta.href || "/admission-hub"}
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-medium text-white transition hover:bg-white/10"
              >
                {hero.secondary_cta.label}
              </Link>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      )}
    </section>
  );
}
