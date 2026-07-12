import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Quote, UserRound } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import { resourceUrl } from "../public/content";

/** Alumni testimonials — auto-advancing carousel from admin key `testimonials`. */
export default function Testimonials({ items }) {
  const list = Array.isArray(items) ? items : [];
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || list.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length, reduce]);

  if (list.length === 0) return null;
  const t = list[index % list.length];

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading eyebrow="Alumni" title="Where our graduates go" />
        <div className="relative mt-14 min-h-[16rem]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center md:p-12"
            >
              <Quote className="mx-auto h-8 w-8 text-brand-400" />
              <blockquote className="mt-6 text-lg leading-relaxed text-slate-700 md:text-xl">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3">
                {t.photo ? (
                  <img
                    src={resourceUrl(t.photo)}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                    <UserRound className="h-6 w-6" />
                  </span>
                )}
                <div className="text-left">
                  <p className="font-display font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">
                    {[t.role_now, t.company].filter(Boolean).join(" · ")}
                    {t.batch ? ` — ${t.batch}` : ""}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        {list.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-brand-500" : "w-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
