import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Search,
  SearchX,
} from "lucide-react";
import PageHero from "../components/public/PageHero";
import SectionHeading from "../components/public/SectionHeading";
import Reveal from "../components/motion/Reveal";
import Faq from "../components/home/Faq";
import { parseContent, resourceUrl } from "../components/public/content";
import { springSoft, staggerContainer, listItem, viewportOnce } from "../components/motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LEVEL_BADGES = {
  Bachelor: "bg-brand-500/90",
  Masters: "bg-purple-500/90",
  Doctorate: "bg-rose-500/90",
};

function DeadlineCountdown({ iso }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(iso).getTime() - now;
  if (isNaN(diff) || diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return (
    <span className="ml-2 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
      {days}d {hours}h left
    </span>
  );
}

function AdmissionHub() {
  const reduce = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 6;

  // Programs + page copy are admin-managed (Admin Dashboard → Website)
  const [programs, setPrograms] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/programs`)
      .then((res) => {
        setPrograms(res.data || []);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load programs. Please try again later."))
      .finally(() => setLoading(false));

    axios
      .get(`${BACKEND_URL}/guest/site/content`, {
        params: { keys: "admission_cycle,admission_steps,admission_faqs" },
      })
      .then((res) => setContent(res.data || {}))
      .catch(() => {});
  }, []);

  const cycle = parseContent(content.admission_cycle, null);
  const steps = parseContent(content.admission_steps, []);
  const admissionFaqs = parseContent(content.admission_faqs, []);

  const filteredPrograms = useMemo(
    () =>
      programs.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (activeFilter === "All" || p.level === activeFilter)
      ),
    [programs, searchTerm, activeFilter]
  );

  const totalPages = Math.ceil(filteredPrograms.length / programsPerPage);
  const currentPrograms = filteredPrograms.slice(
    (currentPage - 1) * programsPerPage,
    currentPage * programsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Admissions"
        title="Find the program that fits your ambition"
        sub="From a rigorous four-year BSc to research-driven MSc, MPhil and PhD programs — start your journey here."
        crumbs={[{ label: "Admission Hub" }]}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/apply"
            className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 hover:bg-amber-400"
          >
            Apply Now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          {cycle?.open && cycle.label && (
            <span className="glass inline-flex items-center rounded-full px-4 py-2 text-sm text-cyan-100">
              <CalendarClock className="mr-2 h-4 w-4 text-cyan-400" />
              {cycle.label}
              {cycle.deadline_iso && <DeadlineCountdown iso={cycle.deadline_iso} />}
            </span>
          )}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Filter + search bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", "Bachelor", "Masters", "Doctorate"].map((filter) => {
              const active = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setCurrentPage(1);
                  }}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={reduce ? undefined : "hub-filter"}
                      className="absolute inset-0 rounded-full bg-slate-900"
                      transition={springSoft}
                    />
                  )}
                  <span className="relative">{filter}</span>
                </button>
              );
            })}
          </div>
          <div className="relative md:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {loading && (
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        )}
        {loadError && <div className="py-16 text-center text-red-600">{loadError}</div>}

        {/* Program grid */}
        {!loading && !loadError && (
          <motion.div
            layout={!reduce}
            className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {currentPrograms.map((program) => (
                <motion.div
                  key={program.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    {program.imageUrl ? (
                      <img
                        src={resourceUrl(program.imageUrl)}
                        alt={program.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="mesh-bg flex h-full items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-cyan-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#050B1F]/80 to-transparent">
                      <h3 className="font-display p-4 text-lg font-bold text-white drop-shadow">
                        {program.title}
                      </h3>
                    </div>
                    <span
                      className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur ${
                        LEVEL_BADGES[program.level] || "bg-slate-700/90"
                      }`}
                    >
                      {program.level}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                      {program.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      {program.duration && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {program.duration}
                        </span>
                      )}
                      {program.credits && <span>{program.credits} credits</span>}
                      {program.applicationDeadline && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" /> {program.applicationDeadline}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <Link
                        to={`/program/${program.id}`}
                        className="group/link inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                      <Link
                        to="/apply"
                        className="rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-900 hover:bg-amber-400"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {currentPrograms.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <SearchX className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="font-display mt-3 text-lg font-semibold text-slate-900">
                  No programs found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && filteredPrograms.length > programsPerPage && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-9 w-9 rounded-full text-sm font-medium ${
                    currentPage === i + 1
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* How to apply stepper */}
      {steps.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Process"
              title="How to apply"
              sub="Four simple steps — the whole application takes under 30 minutes."
            />
            <motion.ol
              variants={staggerContainer(0.12)}
              initial={reduce ? false : "hidden"}
              whileInView="visible"
              viewport={viewportOnce}
              className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {steps.map((s, i) => (
                <motion.li key={i} variants={listItem} className="relative">
                  {i < steps.length - 1 && (
                    <span className="absolute left-full top-6 hidden h-px w-8 -translate-x-4 bg-slate-200 lg:block" />
                  )}
                  <span className="font-display flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white shadow-lg shadow-brand-500/25">
                    {i + 1}
                  </span>
                  <h3 className="font-display mt-4 font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.description}</p>
                </motion.li>
              ))}
            </motion.ol>
            <Reveal className="mt-12 text-center">
              <Link
                to="/apply"
                className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 text-base font-semibold text-slate-900 shadow-xl shadow-amber-500/20 hover:bg-amber-400"
              >
                Start Your Application
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* Admission FAQs */}
      <Faq items={admissionFaqs} eyebrow="Admissions FAQ" title="Questions about applying" />
    </div>
  );
}

export default AdmissionHub;
