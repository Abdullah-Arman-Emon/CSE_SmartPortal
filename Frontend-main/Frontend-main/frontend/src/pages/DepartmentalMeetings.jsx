import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Clock, ExternalLink, Lock, Video } from "lucide-react";
import PageHero from "../components/public/PageHero";
import GlassCard from "../components/public/GlassCard";
import { AuthContext } from "../context/AuthContext";
import { viewportOnce, EASE } from "../components/motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const startsIn = (dateTime) => {
  const diff = new Date(dateTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `in ${days}d ${hours}h`;
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
};

const isToday = (dateTime) => {
  const d = new Date(dateTime);
  const now = new Date();
  return d.toDateString() === now.toDateString();
};

const DepartmentalMeetings = () => {
  const reduce = useReducedMotion();
  const { user } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      // meeting_url is only returned for logged-in teachers/admins
      .get(`${BACKEND_URL}/v1/meetings/upcoming`, { params: { user_id: user?.id } })
      .then((res) => {
        const sorted = (res.data || []).sort(
          (a, b) => new Date(a.date_time) - new Date(b.date_time)
        );
        setMeetings(sorted);
        setError(null);
      })
      .catch(() => setError("Failed to load meetings. Please try again later."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Group by month for timeline dividers
  const groups = meetings.reduce((acc, m) => {
    const key = new Date(m.date_time).toLocaleString("en", {
      month: "long",
      year: "numeric",
    });
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Schedule"
        title="Departmental Meetings"
        sub="Upcoming faculty and departmental meetings. Teachers can RSVP and join from their dashboard."
        crumbs={[{ label: "Meetings" }]}
        stats={meetings.length > 0 ? [{ value: meetings.length, label: "Upcoming" }] : undefined}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {loading && (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        )}
        {error && <div className="py-16 text-center text-red-600">{error}</div>}

        {!loading && !error && meetings.length === 0 && (
          <div className="py-20 text-center">
            <span className="mesh-bg mx-auto flex h-20 w-20 items-center justify-center rounded-3xl">
              <Video className="h-9 w-9 text-cyan-300" />
            </span>
            <h3 className="font-display mt-5 text-lg font-semibold text-slate-900">
              No upcoming meetings
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              New meetings will appear here as soon as they are scheduled.
            </p>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && meetings.length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-5 w-px bg-gradient-to-b from-brand-400/60 via-slate-300 to-transparent" />
            {Object.entries(groups).map(([month, list]) => (
              <div key={month} className="mb-4">
                <motion.h3
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="font-display relative mb-6 ml-14 text-sm font-bold uppercase tracking-[0.15em] text-slate-400"
                >
                  {month}
                </motion.h3>
                <div className="space-y-6">
                  {list.map((meeting, i) => {
                    const d = new Date(meeting.date_time);
                    const today = isToday(meeting.date_time);
                    const chip = startsIn(meeting.date_time);
                    return (
                      <motion.div
                        key={meeting.id}
                        initial={reduce ? false : { opacity: 0, x: i % 2 === 0 ? 24 : 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={viewportOnce}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="relative pl-14"
                      >
                        {/* Node */}
                        <span
                          className={`absolute left-5 top-6 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4 ${
                            today
                              ? "bg-cyan-400 ring-cyan-400/25"
                              : "bg-brand-500 ring-brand-500/20"
                          }`}
                        >
                          {today && !reduce && (
                            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/70" />
                          )}
                        </span>

                        <GlassCard className="!border-slate-200 !bg-white p-5 shadow-sm" interactive>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {today && (
                                  <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                                    Today
                                  </span>
                                )}
                                {chip && (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                    Starts {chip}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-display mt-2 text-lg font-semibold text-slate-900">
                                {meeting.title}
                              </h4>
                              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="h-4 w-4 text-brand-500" />
                                  {d.toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-brand-500" />
                                  {d.toLocaleTimeString("en", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                            {meeting.meeting_url ? (
                              <a
                                href={meeting.meeting_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                              >
                                <Video className="h-4 w-4" /> Join
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                              >
                                <Lock className="h-3.5 w-3.5" /> Login to join
                              </Link>
                            )}
                          </div>
                        </GlassCard>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentalMeetings;
