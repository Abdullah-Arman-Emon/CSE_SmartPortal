import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { GraduationCap, BookOpen, FlaskConical, Layers, Clock, Award, ArrowRight } from "lucide-react";
import PageHero from "../components/public/PageHero";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Exact program overviews from du.ac.bd (undergrad / postGrad / mphil / phd CSE).
const PROGRAMS = [
  {
    key: "bsc",
    name: "BSc (Honours) in CSE",
    icon: GraduationCap,
    accent: "from-brand-500 to-accent-500",
    facts: [
      ["Duration", "4 years / 8 semesters"],
      ["Total credits", "150 credits"],
      ["Graduation", "Min CGPA 2.00, no 'F' grade"],
      ["Max time", "6 years from enrollment"],
    ],
    note: "Admission: minimum GPA 3.50 (incl. 4th subject) separately in SSC & HSC (Science), and total GPA ≥ 8.00.",
  },
  {
    key: "msc",
    name: "MSc in CSE",
    icon: BookOpen,
    accent: "from-purple-500 to-brand-500",
    facts: [
      ["Duration", "1.5 years"],
      ["Total credits", "36 credits (min)"],
      ["Thesis group", "18 course + 18 thesis credits"],
      ["Project group", "30 course + 6 project credits"],
    ],
    note: "Two regular semesters/year (A: Jul–Dec, B: Jan–Jun). Min CGPA 2.50; theory courses within first three semesters; up to 6 semesters.",
  },
  {
    key: "mphil",
    name: "MPhil in CSE",
    icon: Layers,
    accent: "from-emerald-500 to-accent-500",
    facts: [
      ["Duration", "2 years (coursework + thesis)"],
      ["Registration", "4 years maximum"],
      ["Coursework", "2×100-mark or 4×50-mark theory"],
      ["Assessment", "Theory + viva (100 marks)"],
    ],
    note: "Pass mark 50%. Max two supervisors (at least one from CSEDU). Detailed syllabus is published by the department.",
  },
  {
    key: "phd",
    name: "PhD in CSE",
    icon: Award,
    accent: "from-rose-500 to-brand-500",
    facts: [
      ["Duration", "4 years (FT) / 5 years (PT)"],
      ["Coursework", "3 theory courses (3 credits / 100 marks each)"],
      ["Assessment", "Theory + viva (100 marks)"],
      ["Thesis", "Submit after first 2 years"],
    ],
    note: "Min 50% per course. Annual seminars required (≥2 seminar talks before thesis). Course codes/contents mirror the MPhil program.",
  },
];

const CATEGORY_LABELS = {
  general: "General Ed.",
  core: "Core",
  elective1: "Elective I",
  elective2: "Elective II",
  elective3: "Elective III",
  project: "Project / Internship",
};
const CATEGORY_STYLES = {
  general: "bg-amber-100 text-amber-800",
  core: "bg-blue-100 text-blue-800",
  elective1: "bg-purple-100 text-purple-800",
  elective2: "bg-fuchsia-100 text-fuchsia-800",
  elective3: "bg-pink-100 text-pink-800",
  project: "bg-emerald-100 text-emerald-800",
};
const YEAR_LABELS = { 1: "First Year", 2: "Second Year", 3: "Third Year", 4: "Fourth Year" };

export default function Curriculum() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/v1/curriculum`)
      .then((res) => setCourses(res.data || []))
      .catch(() => setError("Could not load the curriculum. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const bsc = useMemo(() => courses.filter((c) => c.program === "bsc"), [courses]);
  const msc = useMemo(() => courses.filter((c) => c.program === "msc"), [courses]);

  // Group BSc into year -> semester_no -> [courses]
  const grouped = useMemo(() => {
    const g = {};
    for (const c of bsc) {
      const y = c.year || 0;
      const s = c.semester_no || 0;
      (g[y] ??= {});
      (g[y][s] ??= []).push(c);
    }
    // sort each semester: core/general first (by code), electives after
    const order = { core: 0, general: 1, project: 2, elective1: 3, elective2: 4, elective3: 5 };
    for (const y of Object.keys(g))
      for (const s of Object.keys(g[y]))
        g[y][s].sort(
          (a, b) => (order[a.category] - order[b.category]) || a.course_code.localeCompare(b.course_code)
        );
    return g;
  }, [bsc]);

  const totalCredits = bsc.reduce((s, c) => s + (c.credit || 0), 0);

  const SemesterTable = ({ list, title }) => {
    const credits = list.reduce((s, c) => s + (c.credit || 0), 0);
    const hasElective = list.some((c) => c.category.startsWith("elective"));
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
          <h4 className="font-display text-sm font-bold text-slate-900 sm:text-base">{title}</h4>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {credits.toFixed(2)} cr
          </span>
        </div>
        <ul className="divide-y divide-slate-50">
          {list.map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-900">{c.course_code}</span>
                  {c.is_lab && (
                    <FlaskConical className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Lab" />
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-snug text-slate-600">{c.title}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium text-slate-700">{c.credit} cr</span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    CATEGORY_STYLES[c.category] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {CATEGORY_LABELS[c.category] || c.category}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {hasElective && (
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 sm:px-5">
            Elective courses: choose one option (with its lab, where applicable).
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Academics"
        title="CSE Curriculum & Programs"
        sub="The complete, official Department of CSE curriculum at the University of Dhaka — undergraduate to doctoral."
        crumbs={[{ label: "Curriculum" }]}
        stats={[
          { value: "150", label: "BSc credits" },
          { value: "4", label: "programs" },
          { value: "1992", label: "since" },
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Program overview cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.key}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.accent} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">{p.name}</h3>
                <dl className="mt-3 flex-1 space-y-1.5 text-sm">
                  {p.facts.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-slate-400">{k}</dt>
                      <dd className="text-right font-medium text-slate-700">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
                  {p.note}
                </p>
              </div>
            );
          })}
        </div>

        {/* BSc curriculum */}
        <div className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                BSc (Honours) Curriculum
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                4 years · 8 semesters · {totalCredits ? totalCredits.toFixed(2) : "150"} credits total
              </p>
            </div>
            <Link
              to="/apply"
              className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              Apply for Admission
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          )}
          {error && <div className="mt-8 rounded-xl bg-red-50 p-6 text-center text-red-600">{error}</div>}

          {!loading &&
            !error &&
            [1, 2, 3, 4].map((year) =>
              grouped[year] ? (
                <div key={year} className="mt-10">
                  <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
                    <Clock className="h-5 w-5 text-brand-500" />
                    {YEAR_LABELS[year]}
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    {[1, 2].map((sem) =>
                      grouped[year][sem] ? (
                        <SemesterTable
                          key={sem}
                          list={grouped[year][sem]}
                          title={`Semester ${year}-${sem}`}
                        />
                      ) : null
                    )}
                  </div>
                </div>
              ) : null
            )}
        </div>

        {/* MSc courses (admin-entered, if any) */}
        {msc.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">MSc Courses</h2>
            <p className="mt-1 text-sm text-slate-500">{msc.length} courses in the graduate catalog.</p>
            <div className="mt-6">
              <SemesterTable list={msc} title="Graduate catalog" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
