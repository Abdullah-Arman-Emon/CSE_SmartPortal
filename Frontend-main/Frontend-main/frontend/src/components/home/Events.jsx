import { useEffect, useState } from "react";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MapPin } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { resourceUrl, formatDate } from "../public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/** Upcoming events — guest-safe read from /student/events/upcoming (auth-less). */
export default function Events() {
  const reduce = useReducedMotion();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/student/events/upcoming`)
      .then((res) => setEvents(res.data || []))
      .catch(() => {});
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Campus"
          title="Upcoming events"
          sub="Hackathons, tech fests, seminars — there is always something happening at CSEDU."
        />
        <motion.div
          variants={staggerContainer(0.1)}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={viewportOnce}
          className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {events.slice(0, 3).map((e) => {
            const d = new Date(e.start_date);
            return (
              <motion.article
                key={e.id}
                variants={listItem}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-40 overflow-hidden">
                  {e.image_url ? (
                    <img
                      src={resourceUrl(e.image_url)}
                      alt={e.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="mesh-bg flex h-full items-center justify-center">
                      <CalendarDays className="h-10 w-10 text-cyan-300" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow">
                    <p className="font-display text-lg font-bold leading-none text-slate-900">
                      {d.getDate()}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                      {d.toLocaleString("en", { month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold leading-snug text-slate-900 group-hover:text-brand-600">
                    {e.name}
                  </h3>
                  {e.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{e.description}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.start_date)}
                    </span>
                    {e.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {e.location}
                      </span>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
