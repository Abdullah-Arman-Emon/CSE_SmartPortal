import { motion, useReducedMotion } from "framer-motion";
import SectionHeading from "../public/SectionHeading";
import GlassCard from "../public/GlassCard";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { getIcon } from "../public/iconMap";

/** Research areas & labs — admin key `research_showcase`. Dark aurora band. */
export default function Research({ showcase }) {
  const areas = Array.isArray(showcase) ? showcase : [];
  const reduce = useReducedMotion();
  if (areas.length === 0) return null;

  return (
    <section className="mesh-bg py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Research"
          title="Pushing the frontiers of computing"
          sub="Active research groups publishing in top venues — from Bengali NLP to smart-city IoT."
          dark
        />
        <motion.div
          variants={staggerContainer(0.08)}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {areas.map((area, i) => {
            const Icon = getIcon(area.icon);
            const card = (
              <GlassCard className="h-full p-6">
                <motion.span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/80 to-accent-500/80 text-white"
                  whileHover={reduce ? undefined : { y: -3, rotate: -4 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
                <h3 className="font-display mt-4 text-lg font-semibold">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{area.description}</p>
              </GlassCard>
            );
            return (
              <motion.div key={i} variants={listItem}>
                {area.link ? (
                  <a href={area.link} target="_blank" rel="noreferrer" className="block h-full">
                    {card}
                  </a>
                ) : (
                  card
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
