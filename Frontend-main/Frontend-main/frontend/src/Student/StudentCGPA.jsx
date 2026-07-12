import { useState, useMemo, useEffect, useContext } from "react";
import axios from "axios";
import { Calculator, Plus, Trash2, Target, GraduationCap } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// University of Dhaka standard 4.00 grading scale.
const GRADES = [
  { g: "A+", p: 4.0 },
  { g: "A", p: 3.75 },
  { g: "A-", p: 3.5 },
  { g: "B+", p: 3.25 },
  { g: "B", p: 3.0 },
  { g: "B-", p: 2.75 },
  { g: "C+", p: 2.5 },
  { g: "C", p: 2.25 },
  { g: "D", p: 2.0 },
  { g: "F", p: 0.0 },
];
const pointOf = (g) => GRADES.find((x) => x.g === g)?.p ?? 0;

// DU degree requirements per program
const PROGRAM_RULES = {
  bsc: { totalCredits: 150, minCgpa: 2.0 },
  msc: { totalCredits: 36, minCgpa: 2.5 },
};

const CATEGORY_LABELS = {
  general: "General Education",
  core: "Core",
  elective1: "Elective I",
  elective2: "Elective II",
  elective3: "Elective III",
  project: "Project / Internship",
  uncategorized: "Uncategorized",
};

function StudentCGPA() {
  const { user } = useContext(AuthContext);
  // Real published results, grouped by semester (pre-filled, read-only)
  const [publishedBySemester, setPublishedBySemester] = useState({});
  const [publishedResults, setPublishedResults] = useState([]);
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null); // backend CGPA (retake-safe)
  const [catalogMap, setCatalogMap] = useState({}); // course_code -> category

  useEffect(() => {
    if (!user?.id) return;
    let sid = null;
    axios
      .get(`${BACKEND_URL}/v1/auth/get/student`, { params: { user_id: user.id } })
      .then((res) => {
        setProfile(res.data || null);
        sid = res.data?.id;
        if (!sid) return;
        return Promise.all([
          axios.get(`${BACKEND_URL}/v1/results/student/${sid}`),
          axios.get(`${BACKEND_URL}/v1/results/student/${sid}/summary`),
        ]);
      })
      .then((arr) => {
        if (!arr) return;
        const [res, sum] = arr;
        setPublishedResults(res.data || []);
        setSummary(sum.data || null);
        const grouped = {};
        (res.data || []).forEach((r) => {
          const key = `Batch ${r.batch} · ${r.semester}`;
          (grouped[key] = grouped[key] || []).push(r);
        });
        setPublishedBySemester(grouped);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/v1/curriculum`)
      .then((res) => {
        const map = {};
        (res.data || []).forEach((c) => {
          map[c.course_code] = c.category;
        });
        setCatalogMap(map);
      })
      .catch(() => {});
  }, []);

  // Degree progress from real published results (DU rules)
  const progress = useMemo(() => {
    const program = profile?.program === "msc" ? "msc" : "bsc";
    const rules = PROGRAM_RULES[program];
    let earned = 0,
      qp = 0,
      attempted = 0,
      hasF = false;
    const byCategory = {};
    publishedResults.forEach((r) => {
      const c = r.credit || 0;
      attempted += c;
      qp += c * (r.grade_point || 0);
      if (r.grade === "F") {
        hasF = true;
        return; // F earns no credit
      }
      earned += c;
      const cat = (r.catalog_code && catalogMap[r.catalog_code]) || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + c;
    });
    // Backend summary is authoritative (applies latest-attempt retake rule).
    const cgpa = summary ? summary.cgpa : (attempted ? qp / attempted : 0);
    const earnedCr = summary ? summary.earned_credits : earned;
    const f = summary ? summary.has_f : hasF;
    return { program, rules, earned: earnedCr, cgpa, hasF: f, byCategory };
  }, [publishedResults, catalogMap, profile, summary]);

  // Current semester courses
  const [rows, setRows] = useState([
    { id: 1, name: "", credit: 3, grade: "A" },
  ]);
  // Past semesters as (gpa, credits) so we can roll into CGPA
  const [past, setPast] = useState([]);
  // Target planner
  const [target, setTarget] = useState("");
  const [remainingCredits, setRemainingCredits] = useState("");

  const addRow = () =>
    setRows((r) => [...r, { id: Date.now(), name: "", credit: 3, grade: "A" }]);
  const removeRow = (id) => setRows((r) => r.filter((x) => x.id !== id));
  const setRow = (id, key, val) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: val } : x)));

  const semester = useMemo(() => {
    let cr = 0,
      qp = 0;
    rows.forEach((x) => {
      const c = parseFloat(x.credit) || 0;
      cr += c;
      qp += c * pointOf(x.grade);
    });
    return { credits: cr, gpa: cr ? qp / cr : 0, quality: qp };
  }, [rows]);

  const cgpa = useMemo(() => {
    let cr = semester.credits,
      qp = semester.quality;
    past.forEach((p) => {
      const c = parseFloat(p.credits) || 0;
      cr += c;
      qp += c * (parseFloat(p.gpa) || 0);
    });
    return { credits: cr, gpa: cr ? qp / cr : 0 };
  }, [semester, past]);

  const required = useMemo(() => {
    const t = parseFloat(target);
    const rc = parseFloat(remainingCredits);
    if (!t || !rc) return null;
    const currentCr = cgpa.credits;
    const currentQp = cgpa.gpa * currentCr;
    const needed = (t * (currentCr + rc) - currentQp) / rc;
    return needed;
  }, [target, remainingCredits, cgpa]);

  const card = "bg-white rounded-xl border border-slate-200 p-6 shadow-sm";
  const badge = (v) =>
    v >= 3.75 ? "text-green-600" : v >= 3.0 ? "text-blue-600" : v >= 2.0 ? "text-amber-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Calculator className="text-indigo-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">CGPA Calculator</h1>
          <p className="text-slate-500 text-sm">University of Dhaka 4.00 grading scale.</p>
        </div>
      </div>

      {Object.keys(publishedBySemester).length > 0 && (
        <div className={card}>
          <h2 className="font-semibold text-slate-800 mb-4">My Published Results</h2>
          <div className="space-y-4">
            {Object.entries(publishedBySemester).map(([sem, courses]) => {
              const cr = courses.reduce((s, c) => s + (c.credit || 0), 0);
              const qp = courses.reduce((s, c) => s + (c.credit || 0) * (c.grade_point || 0), 0);
              const gpa = cr ? qp / cr : 0;
              return (
                <div key={sem} className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-slate-700">{sem}</p>
                    <p className="text-xs text-slate-400">{courses.map((c) => c.course_code).join(", ")} · {cr} credits</p>
                  </div>
                  <span className={`text-lg font-bold ${badge(gpa)}`}>{gpa.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">Add these as "past semesters" below to roll them into your what-if CGPA planner.</p>
        </div>
      )}

      {/* Degree Progress (DU requirements) */}
      {publishedResults.length > 0 && (
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap size={18} /> Degree Progress —{" "}
              {progress.program === "msc" ? "MSc" : "BSc (Honours)"}
            </h2>
            {profile?.current_semester && (
              <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                Current semester: {profile.current_semester}
              </span>
            )}
          </div>

          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">
              Credits earned: <b>{progress.earned}</b> / {progress.rules.totalCredits}
            </span>
            <span className="text-slate-500">
              {((progress.earned / progress.rules.totalCredits) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (progress.earned / progress.rules.totalCredits) * 100)}%`,
              }}
            />
          </div>

          {progress.program === "msc" && (
            <p className="text-xs text-slate-500 mb-3">
              {profile?.msc_group === "thesis"
                ? "Thesis group: 18 cr coursework + 18 cr thesis."
                : profile?.msc_group === "project"
                ? "Project group: 30 cr coursework + 6 cr project."
                : "Open credit: 36 credits total (Thesis: 18+18 · Project: 30+6)."}
            </p>
          )}

          {progress.program === "bsc" && Object.keys(progress.byCategory).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(progress.byCategory).map(([cat, cr]) => (
                <span key={cat} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                  {CATEGORY_LABELS[cat] || cat}: {cr} cr
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                progress.cgpa >= progress.rules.minCgpa
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              CGPA {progress.cgpa.toFixed(2)} {progress.cgpa >= progress.rules.minCgpa ? "≥" : "<"}{" "}
              {progress.rules.minCgpa.toFixed(2)} required
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                progress.hasF ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
            >
              {progress.hasF ? "Has F grade — must clear for graduation" : "No F grades"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Based on published results only. Categories follow the official DU CSE curriculum.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current semester */}
        <div className={`lg:col-span-2 ${card}`}>
          <h2 className="font-semibold text-slate-800 mb-4">Current Semester</h2>
          <div className="space-y-2">
            {rows.map((x) => (
              <div key={x.id} className="flex gap-2 items-center">
                <input
                  value={x.name} onChange={(e) => setRow(x.id, "name", e.target.value)}
                  placeholder="Course name" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="number" min="0" step="0.5" value={x.credit}
                  onChange={(e) => setRow(x.id, "credit", e.target.value)}
                  className="w-20 px-2 py-2 border border-slate-300 rounded-lg text-sm" title="Credit"
                />
                <select
                  value={x.grade} onChange={(e) => setRow(x.id, "grade", e.target.value)}
                  className="w-24 px-2 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {GRADES.map((g) => <option key={g.g} value={g.g}>{g.g} ({g.p})</option>)}
                </select>
                <button onClick={() => removeRow(x.id)} className="text-slate-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addRow} className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
            <Plus size={16} /> Add course
          </button>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-600">Semester GPA ({semester.credits} credits)</span>
            <span className={`text-2xl font-bold ${badge(semester.gpa)}`}>{semester.gpa.toFixed(2)}</span>
          </div>
        </div>

        {/* CGPA + past semesters */}
        <div className={card}>
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <GraduationCap size={18} /> Cumulative CGPA
          </h2>
          <div className="text-center py-4">
            <p className={`text-5xl font-black ${badge(cgpa.gpa)}`}>{cgpa.gpa.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">{cgpa.credits} total credits</p>
          </div>

          <h3 className="text-sm font-medium text-slate-700 mt-4 mb-2">Past semesters</h3>
          {past.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input type="number" step="0.01" placeholder="GPA" value={p.gpa}
                onChange={(e) => setPast((arr) => arr.map((a, j) => j === i ? { ...a, gpa: e.target.value } : a))}
                className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
              <input type="number" placeholder="Credits" value={p.credits}
                onChange={(e) => setPast((arr) => arr.map((a, j) => j === i ? { ...a, credits: e.target.value } : a))}
                className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg text-sm" />
            </div>
          ))}
          <button onClick={() => setPast((a) => [...a, { gpa: "", credits: "" }])} className="text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
            <Plus size={14} /> Add past semester
          </button>
        </div>
      </div>

      {/* Target planner */}
      <div className={card}>
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Target size={18} /> Target CGPA planner</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Target CGPA</label>
            <input type="number" step="0.01" max="4" value={target} onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 3.75" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Remaining credits</label>
            <input type="number" value={remainingCredits} onChange={(e) => setRemainingCredits(e.target.value)}
              placeholder="e.g. 40" className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          {required !== null && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${required > 4 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {required > 4
                ? `Not achievable (would need GPA ${required.toFixed(2)} > 4.00)`
                : `You need an average GPA of ${Math.max(0, required).toFixed(2)} in remaining courses.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCGPA;
