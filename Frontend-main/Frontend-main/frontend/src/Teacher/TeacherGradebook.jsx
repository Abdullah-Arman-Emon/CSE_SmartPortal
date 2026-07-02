import { useState, useEffect } from "react";
import axios from "axios";
import { Save, Send, GraduationCap } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const GRADE_COLOR = {
  "A+": "text-green-600", A: "text-green-600", "A-": "text-green-600",
  "B+": "text-amber-600", B: "text-amber-600", "B-": "text-amber-600",
  "C+": "text-orange-600", C: "text-orange-600",
  D: "text-red-500", F: "text-red-600",
};

function TeacherGradebook({ teacherProfile }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!teacherProfile?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`)
      .then((res) => setCourses(res.data || []))
      .catch(() => {});
  }, [teacherProfile]);

  const load = () => {
    if (!courseId) return;
    axios
      .get(`${BACKEND_URL}/v1/results/course/${courseId}/students`)
      .then((res) => {
        setCourse(res.data);
        setStudents((res.data.students || []).map((s) => ({ ...s, marks: s.marks ?? "" })));
      })
      .catch(() => flash("error", "Failed to load roster."));
  };

  useEffect(load, [courseId]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const setMarks = (studentId, value) =>
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, marks: value } : s)));

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/v1/results/save`, {
        course_id: Number(courseId),
        entries: students.map((s) => ({
          student_id: s.student_id,
          marks: s.marks === "" ? null : Number(s.marks),
        })),
      });
      flash("success", "Draft saved.");
      load();
    } catch (e) {
      flash("error", e.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!window.confirm("Publish results? Students will be notified immediately.")) return;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap size={24} /> Gradebook
        </h1>
        <p className="text-slate-500 mt-1">Enter marks, save as draft, then publish when ready.</p>
      </div>

      {msg.text && (
        <div className={`px-4 py-3 rounded-lg border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full sm:w-96 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title} ({c.code}) — Batch {c.batch}</option>
          ))}
        </select>
      </div>

      {!courseId ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Select a course to begin.
        </div>
      ) : !course ? (
        <p className="text-slate-500 text-center py-8">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800">{course.course_title} ({course.course_code})</h3>
              <p className="text-sm text-slate-500">{course.credit} credit hours · DU grading scale</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={save} disabled={saving}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm"
              >
                <Save size={16} /> {saving ? "Saving…" : "Save Draft"}
              </button>
              <button
                onClick={publish} disabled={publishing}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm"
              >
                <Send size={16} /> {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No students enrolled in this course.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-center">Marks (/100)</th>
                    <th className="px-4 py-2 text-center">Grade</th>
                    <th className="px-4 py-2 text-center">Grade Point</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td className="px-4 py-2 text-slate-700">{s.name}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="number" min={0} max={100} value={s.marks}
                          onChange={(e) => setMarks(s.student_id, e.target.value)}
                          disabled={s.published}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center disabled:bg-slate-100"
                        />
                      </td>
                      <td className={`px-4 py-2 text-center font-bold ${GRADE_COLOR[s.grade] || "text-slate-400"}`}>{s.grade || "—"}</td>
                      <td className="px-4 py-2 text-center">{s.grade_point ?? "—"}</td>
                      <td className="px-4 py-2 text-center">
                        {s.published ? (
                          <span className="text-green-600 text-xs font-medium">Published</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Draft</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherGradebook;
