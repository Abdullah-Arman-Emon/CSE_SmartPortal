import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "../public/SectionHeading";
import GlassCard from "../public/GlassCard";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { getIcon } from "../public/iconMap";

/** Achievements & rankings strip — admin key `achievements_showcase`. */
export default function Achievements({ showcase }) {
  const items = Array.isArray(showcase) ? showcase : [];
  const reduce = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <section className="mesh-bg-soft py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Recognition" title="A legacy of excellence" dark />
        <motion.div
          variants={staggerContainer(0.08)}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((a, i) => {
            const Icon = getIcon(a.icon);
            return (
              <motion.div key={i} variants={listItem}>
                <GlassCard className="h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    {a.year && <span className="text-xs font-medium text-slate-400">{a.year}</span>}
                  </div>
                  <h3 className="font-display mt-4 font-semibold">{a.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{a.detail}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
