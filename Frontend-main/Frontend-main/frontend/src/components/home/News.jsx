import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Paperclip, Pin } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";
import { formatDate } from "../public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORY_COLORS = {
  Chairman: "bg-purple-100 text-purple-700",
  Admin: "bg-sky-100 text-sky-700",
  "Student-Club": "bg-emerald-100 text-emerald-700",
  Department: "bg-brand-500/10 text-brand-700",
  Central: "bg-rose-100 text-rose-700",
};

/** Latest notices — top 3 from the public guest endpoint. */
export default function News() {
  const reduce = useReducedMotion();
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/notices`, { params: { limit: 3 } })
      .then((res) => setNotices(res.data?.items || []))
      .catch(() => {});
  }, []);

  if (notices.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Announcements"
          title="Latest news & notices"
          align="left"
          className="md:max-w-xl"
        />
        <Link
          to="/notice-board"
          className="group inline-flex shrink-0 items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
        >
          View all notices
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <motion.div
        variants={staggerContainer(0.1)}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={viewportOnce}
        className="mt-12 grid gap-6 md:grid-cols-3"
      >
        {notices.map((n) => (
          <motion.article key={n.id} variants={listItem}>
            <Link
              to="/notice-board"
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    CATEGORY_COLORS[n.notice_from] || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {n.notice_from}
                </span>
                {n.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
              </div>
              <h3 className="font-display mt-4 text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-600">
                {n.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                {n.content}
              </p>
              <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                <time>{formatDate(n.date)}</time>
                {n.attachments?.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {n.attachments.length}
                  </span>
                )}
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
