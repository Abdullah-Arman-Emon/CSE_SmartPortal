import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import Reveal from "../motion/Reveal";

/** FAQ accordion — items = parsed `faqs` (or `admission_faqs`) key. */
export default function Faq({ items, eyebrow = "FAQ", title = "Frequently asked questions" }) {
  const faqs = Array.isArray(items) ? items : [];
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(0);

  if (faqs.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="mt-12 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={i} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-display font-semibold text-slate-900">{f.q}</span>
                  <motion.span
                    animate={reduce ? undefined : { rotate: isOpen ? 45 : 0 }}
                    className={`shrink-0 ${isOpen ? "text-brand-600" : "text-slate-400"}`}
                  >
                    <Plus className="h-5 w-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
