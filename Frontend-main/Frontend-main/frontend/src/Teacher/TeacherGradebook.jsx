import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Save, Send, GraduationCap, Search, Filter, X, Pencil, CheckCircle2,
  Users, TrendingUp, Award, AlertTriangle, BookOpen, Lock, ChevronLeft,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// DU 4.00 scale — mirrors backend app/Rakib/academics.py for live preview only.
const GRADE_SCALE = [
  [80, "A+", 4.0], [75, "A", 3.75], [70, "A-", 3.5], [65, "B+", 3.25],
  [60, "B", 3.0], [55, "B-", 2.75], [50, "C+", 2.5], [45, "C", 2.25], [40, "D", 2.0],
];
function gradeOf(marks) {
  if (marks === "" || marks === null || marks === undefined || isNaN(marks)) return { grade: null, gp: null };
  const m = Number(marks);
  for (const [thr, g, gp] of GRADE_SCALE) if (m >= thr) return { grade: g, gp };
  return { grade: "F", gp: 0 };
}
const GRADE_COLOR = {
  "A+": "text-green-600", A: "text-green-600", "A-": "text-green-600",
  "B+": "text-lime-600", B: "text-amber-600", "B-": "text-amber-600",
  "C+": "text-orange-600", C: "text-orange-600", D: "text-red-500", F: "text-red-600",
};

function Stat({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700", green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium opacity-80">
        <Icon size={13} /> {label}
      </div>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
    </div>
  );
}

function TeacherGradebook({ teacherProfile }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false); // re-open published grades for update
  const [msg, setMsg] = useState({ type: "", text: "" });

  // filters
  const [batchF, setBatchF] = useState("all");
  const [semF, setSemF] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!teacherProfile?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`)
      .then((res) => setCourses(res.data || []))
      .catch(() => flash("error", "Could not load your courses."));
  }, [teacherProfile]);

  const load = () => {
    if (!courseId) { setCourse(null); return; }
    axios
      .get(`${BACKEND_URL}/v1/results/course/${courseId}/students`)
      .then((res) => {
        setCourse(res.data);
        setStudents((res.data.students || []).map((s) => ({ ...s, marks: s.marks ?? "" })));
        setEditing(false);
      })
      .catch(() => flash("error", "Failed to load roster."));
  };
  useEffect(load, [courseId]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const setMarks = (studentId, value) =>
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, marks: value } : s)));

  const anyPublished = students.some((s) => s.published);
  const locked = (s) => s.published && !editing;

  const save = async () => {
    // validate 0..100
    for (const s of students) {
      if (s.marks !== "" && (Number(s.marks) < 0 || Number(s.marks) > 100 || isNaN(s.marks))) {
        return flash("error", `Invalid marks for ${s.name} — must be 0–100.`);
      }
    }
    setSaving(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/v1/results/save`, {
        course_id: Number(courseId),
        entries: students.map((s) => ({
          student_id: s.student_id,
          marks: s.marks === "" ? null : Number(s.marks),
        })),
      });
      const upd = res.data?.updated_published || 0;
      flash("success", upd ? `Saved — ${upd} published grade(s) updated & students notified.` : "Draft saved.");
      load();
    } catch (e) {
      flash("error", e.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!window.confirm("Publish results? Students will be notified immediately and grades roll into their CGPA.")) return;
    setPublishing(true);
    try {
      await axios.put(`${BACKEND_URL}/v1/results/publish/${courseId}`);
      flash("success", "Results published.");
      load();
    } catch (e) {
      flash("error", e.response?.data?.detail || "Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  // ---- filter option derivation ----
  const batches = useMemo(
    () => [...new Set(courses.map((c) => c.batch).filter((b) => b != null))].sort((a, b) => b - a),
    [courses]
  );
  const semesters = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => { if (batchF === "all" || String(c.batch) === batchF) set.add(c.semester); });
    return [...set].filter(Boolean).sort();
  }, [courses, batchF]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (batchF !== "all" && String(c.batch) !== batchF) return false;
      if (semF !== "all" && c.semester !== semF) return false;
      if (q && !(`${c.title} ${c.code} ${c.course_code || ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [courses, batchF, semF, search]);

  const anyFilter = batchF !== "all" || semF !== "all" || search;

  // ---- class statistics for the open course ----
  const stats = useMemo(() => {
    const scored = students
      .map((s) => (s.marks === "" ? null : Number(s.marks)))
      .filter((m) => m !== null && !isNaN(m));
    const graded = scored.length;
    const avg = graded ? (scored.reduce((a, b) => a + b, 0) / graded) : 0;
    const high = graded ? Math.max(...scored) : 0;
    const low = graded ? Math.min(...scored) : 0;
    const passed = scored.filter((m) => m >= 40).length;
    const dist = {};
    students.forEach((s) => {
      const g = s.marks === "" ? null : gradeOf(s.marks).grade;
      if (g) dist[g] = (dist[g] || 0) + 1;
    });
    return { enrolled: students.length, graded, avg, high, low, passRate: graded ? Math.round((passed / graded) * 100) : 0, dist };
  }, [students]);

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={24} className="text-amber-500" /> Gradebook
          </h1>
          <p className="text-slate-500 mt-1 text-sm max-w-2xl">
            Enter marks → grades compute on the DU 4.00 scale automatically → <b>save as draft</b> (only you see it) →
            <b> publish</b> to release to students and roll into their semester GPA &amp; CGPA. Published grades can still be
            corrected with <b>Update</b>, which re-notifies the student and recomputes their transcript.
          </p>
        </div>
      </div>

      {msg.text && (
        <div className={`px-4 py-3 rounded-lg border text-sm ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* ---------- COURSE PICKER with filters ---------- */}
      {!courseId && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 mr-1"><Filter size={13} /> Filter</span>
            <select value={batchF} onChange={(e) => { setBatchF(e.target.value); setSemF("all"); }}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
              <option value="all">All batches</option>
              {batches.map((b) => <option key={b} value={b}>Batch {b}</option>)}
            </select>
            <select value={semF} onChange={(e) => setSemF(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
              <option value="all">All semesters</option>
              {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course…"
                className="w-full text-sm border border-slate-200 rounded-lg pl-8 pr-3 py-1.5" />
            </div>
            {anyFilter && (
              <button onClick={() => { setBatchF("all"); setSemF("all"); setSearch(""); }}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                <X size={12} /> Clear
              </button>
            )}
            <span className="text-xs text-slate-400">{filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}</span>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              {courses.length === 0 ? "You have no courses assigned yet." : "No courses match these filters."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => (
                <button key={c.id} onClick={() => setCourseId(String(c.id))}
                  className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-amber-400 hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-2 rounded-lg bg-amber-50 text-amber-600"><BookOpen size={16} /></span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{c.type}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 leading-tight">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.course_code || c.code}</p>
                  <p className="text-xs text-slate-400 mt-2">Batch {c.batch} · Semester {c.semester}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------- ROSTER / GRADING ---------- */}
      {courseId && (
        <>
          <button onClick={() => setCourseId("")}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ChevronLeft size={16} /> All courses
          </button>

          {!course ? (
            <p className="text-slate-500 text-center py-8">Loading roster…</p>
          ) : (
            <div className="space-y-4">
              {/* header + actions */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{course.course_title}</h3>
                    <p className="text-sm text-slate-500">
                      {course.course_code} · {course.credit} credit{course.credit === 1 ? "" : "s"}
                      {selectedCourse ? ` · Batch ${selectedCourse.batch} · Semester ${selectedCourse.semester}` : ""}
                    </p>
                    <span className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                      anyPublished ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {anyPublished ? <><CheckCircle2 size={12} /> Published</> : <><Pencil size={12} /> Draft</>}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {anyPublished && !editing && (
                      <button onClick={() => setEditing(true)}
                        className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm">
                        <Pencil size={16} /> Update grades
                      </button>
                    )}
                    {editing && (
                      <button onClick={() => { setEditing(false); load(); }}
                        className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm">
                        <X size={16} /> Cancel edit
                      </button>
                    )}
                    <button onClick={save} disabled={saving || (anyPublished && !editing)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm">
                      <Save size={16} /> {saving ? "Saving…" : anyPublished ? "Save changes" : "Save draft"}
                    </button>
                    <button onClick={publish} disabled={publishing || (anyPublished && !editing)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm">
                      <Send size={16} /> {publishing ? "Publishing…" : anyPublished ? "Re-publish" : "Publish"}
                    </button>
                  </div>
                </div>

                {/* statistics */}
                {students.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
                    <Stat icon={Users} label="Enrolled" value={stats.enrolled} tone="indigo" />
                    <Stat icon={Pencil} label="Graded" value={`${stats.graded}/${stats.enrolled}`} />
                    <Stat icon={TrendingUp} label="Average" value={stats.graded ? stats.avg.toFixed(1) : "—"} tone="amber" />
                    <Stat icon={Award} label="Highest" value={stats.graded ? stats.high : "—"} tone="green" />
                    <Stat icon={AlertTriangle} label="Pass rate" value={stats.graded ? `${stats.passRate}%` : "—"}
                      tone={stats.passRate >= 60 ? "green" : "red"} />
                  </div>
                )}

                {/* grade distribution */}
                {stats.graded > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-1.5">Grade distribution</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(stats.dist).sort().map(([g, n]) => (
                        <span key={g} className={`text-xs px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 font-semibold ${GRADE_COLOR[g] || "text-slate-500"}`}>
                          {g} · {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* roster table */}
              {students.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                  No students enrolled in this course.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">#</th>
                          <th className="px-4 py-2.5 text-left font-medium">Student</th>
                          <th className="px-4 py-2.5 text-center font-medium">Marks /100</th>
                          <th className="px-4 py-2.5 text-center font-medium">Grade</th>
                          <th className="px-4 py-2.5 text-center font-medium">Point</th>
                          <th className="px-4 py-2.5 text-center font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((s, i) => {
                          const live = gradeOf(s.marks);
                          const g = live.grade ?? s.grade;
                          const gp = live.gp ?? s.grade_point;
                          return (
                            <tr key={s.student_id} className="hover:bg-slate-50/60">
                              <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                              <td className="px-4 py-2 text-slate-700 font-medium">{s.name}</td>
                              <td className="px-4 py-2 text-center">
                                <input
                                  type="number" min={0} max={100} value={s.marks}
                                  onChange={(e) => setMarks(s.student_id, e.target.value)}
                                  disabled={locked(s)}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </td>
                              <td className={`px-4 py-2 text-center font-bold ${GRADE_COLOR[g] || "text-slate-300"}`}>{g || "—"}</td>
                              <td className="px-4 py-2 text-center text-slate-600">{gp ?? "—"}</td>
                              <td className="px-4 py-2 text-center">
                                {s.published ? (
                                  editing ? (
                                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium"><Pencil size={11} /> Editing</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><Lock size={11} /> Published</span>
                                  )
                                ) : (
                                  <span className="text-slate-400 text-xs">Draft</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TeacherGradebook;
