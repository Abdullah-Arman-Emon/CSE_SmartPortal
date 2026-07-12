import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, GraduationCap } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { resourceUrl } from "../public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LEVEL_STYLES = {
  Bachelor: "bg-brand-500/90",
  Masters: "bg-purple-500/90",
  Doctorate: "bg-rose-500/90",
};

/** Programs preview — horizontal snap-scroll cards from /guest/site/programs. */
export default function ProgramsPreview() {
  const reduce = useReducedMotion();
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/programs`)
      .then((res) => setPrograms((res.data || []).filter((p) => p.is_active !== false)))
      .catch(() => {});
  }, []);

  if (programs.length === 0) return null;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Academics"
            title="Programs built for the future"
            align="left"
            className="md:max-w-xl"
          />
          <Link
            to="/admission-hub"
            className="group inline-flex shrink-0 items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
          >
            All programs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <motion.div
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-[max(1rem,calc((100vw-80rem)/2+1.5rem))]"
      >
        {programs.slice(0, 8).map((p) => (
          <motion.div key={p.id} variants={listItem} className="w-80 shrink-0 snap-start">
            <Link
              to={`/program/${p.id}`}
              className="group block h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-44 overflow-hidden">
                {p.imageUrl ? (
                  <img
                    src={resourceUrl(p.imageUrl)}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="mesh-bg-soft flex h-full items-center justify-center">
                    <GraduationCap className="h-10 w-10 text-cyan-300" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur ${
                    LEVEL_STYLES[p.level] || "bg-slate-700/90"
                  }`}
                >
                  {p.level}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold leading-snug text-slate-900 group-hover:text-brand-600">
                  {p.title}
                </h3>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  {p.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {p.duration}
                    </span>
                  )}
                  {p.credits && <span>{p.credits} credits</span>}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
