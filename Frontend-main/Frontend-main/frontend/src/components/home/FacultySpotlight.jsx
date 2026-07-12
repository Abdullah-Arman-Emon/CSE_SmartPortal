import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, UserRound } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { resourceUrl } from "../public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Faculty spotlight — people whose ids are in the admin key
 * `home_featured_people`; falls back to the first 4 active faculty.
 */
export default function FacultySpotlight({ featuredIds }) {
  const reduce = useReducedMotion();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/people`)
      .then((res) => {
        const all = (res.data || []).filter((p) => p.is_active !== false);
        const ids = Array.isArray(featuredIds) ? featuredIds.map(Number) : [];
        let picked =
          ids.length > 0 ? all.filter((p) => ids.includes(Number(p.id))) : [];
        if (picked.length === 0) {
          picked = all.filter((p) => p.category === "Faculty").slice(0, 4);
        }
        setPeople(picked.slice(0, 4));
      })
      .catch(() => {});
  }, [featuredIds]);

  if (people.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="People"
          title="Meet our faculty"
          align="left"
          className="md:max-w-xl"
        />
        <Link
          to="/people"
          className="group inline-flex shrink-0 items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
        >
          Full directory
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <motion.div
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4"
      >
        {people.map((p) => (
          <motion.div key={p.id} variants={listItem}>
            <Link
              to="/people"
              className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                {p.image ? (
                  <img
                    src={resourceUrl(p.image)}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <UserRound className="h-16 w-16" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050B1F]/90 via-[#050B1F]/40 to-transparent p-4 pt-12">
                  <h3 className="font-display text-sm font-semibold leading-snug text-white sm:text-base">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-300">{p.role}</p>
                </div>
              </div>
              {p.expertise?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3">
                  {p.expertise.slice(0, 2).map((e, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-700"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
