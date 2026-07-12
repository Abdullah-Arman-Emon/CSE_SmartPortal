import { useEffect, useState } from "react";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap, Users, BookOpen, FlaskConical } from "lucide-react";
import AnimatedCounter from "../public/AnimatedCounter";
import { staggerContainer, listItem, viewportOnce } from "../motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const ICONS = [Users, GraduationCap, BookOpen, FlaskConical];

/**
 * Quick stats strip. Live counts from /utility/stats/overview, merged with the
 * admin-managed `dept_stats` labels (admin rows win when both exist).
 */
export default function Stats({ deptStats }) {
  const reduce = useReducedMotion();
  const [live, setLive] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/utility/stats/overview`)
      .then((res) => setLive(res.data))
      .catch(() => {});
  }, []);

  // Admin-managed dept_stats rows take precedence; live portal counts only
  // fill in labels the admin hasn't provided.
  const stats = Array.isArray(deptStats) && deptStats.length > 0 ? [...deptStats] : [];
  if (live) {
    const liveRows = [
      live.total_students != null && { label: "Students", value: `${live.total_students}+` },
      live.total_teachers != null && { label: "Faculty Members", value: `${live.total_teachers}` },
      live.total_courses != null && { label: "Courses Offered", value: `${live.total_courses}+` },
    ].filter(Boolean);
    for (const row of liveRows) {
      const exists = stats.some((s) => s.label?.toLowerCase() === row.label.toLowerCase());
      if (!exists && stats.length < 4) stats.push(row);
    }
  }
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 mx-auto -mt-16 mb-14 max-w-6xl px-4 sm:-mt-20 sm:px-6">
      <motion.div
        variants={staggerContainer(0.08)}
        initial={reduce ? false : "hidden"}
        whileInView="visible"
        viewport={viewportOnce}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.slice(0, 4).map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <motion.div
              key={i}
              variants={listItem}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-display mt-4 text-3xl font-bold text-slate-900">
                <AnimatedCounter value={s.value} />
              </p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
