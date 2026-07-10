import { useState, useEffect } from "react";
import axios from "axios";
import { Users, UserMinus, UploadCloud, Megaphone, Trash2, Send } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function TeacherRoster({ teacherProfile }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [roster, setRoster] = useState({ count: 0, students: [] });
  const [emails, setEmails] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  useEffect(() => {
    if (!teacherProfile?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`)
      .then((res) => setCourses(res.data || []))
      .catch((e) => console.error(e));
  }, [teacherProfile]);

  const loadRoster = (id) => {
    if (!id) return;
    axios.get(`${BACKEND_URL}/v1/teacher/courses/roster/${id}`).then((r) => setRoster(r.data));
    axios.get(`${BACKEND_URL}/v1/announcements/course/${id}`).then((r) => setAnnouncements(r.data || []));
  };

  useEffect(() => { if (courseId) loadRoster(courseId); }, [courseId]);

  const removeStudent = async (sid) => {
    if (!window.confirm("Remove this student from the course?")) return;
    await axios.delete(`${BACKEND_URL}/v1/teacher/courses/roster/${courseId}/${sid}`);
    loadRoster(courseId);
    flash("success", "Student removed.");
  };

  const enroll = async () => {
    const list = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
    if (list.length === 0) return flash("error", "Paste at least one email.");
    try {
      const res = await axios.post(`${BACKEND_URL}/v1/teacher/courses/roster/${courseId}/enroll`, { emails: list });
      setEmails("");
      loadRoster(courseId);
      flash("success", `Added ${res.data.added}, skipped ${res.data.skipped}, not found ${res.data.not_found.length}.`);
    } catch (e) {
      flash("error", e.response?.data?.detail || "Enroll failed.");
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEmails((prev) => (prev ? prev + "\n" : "") + reader.result);
    reader.readAsText(file);
  };

  const postAnnouncement = async () => {
    if (!newAnn.trim()) return;
    await axios.post(`${BACKEND_URL}/v1/announcements`, {
      course_id: Number(courseId), teacher_id: teacherProfile.id, text: newAnn.trim(),
    });
    setNewAnn("");
    loadRoster(courseId);
    flash("success", "Announcement posted.");
  };

  const delAnnouncement = async (id) => {
    await axios.delete(`${BACKEND_URL}/v1/announcements/${id}`);
    loadRoster(courseId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Students &amp; Announcements</h1>
        <p className="text-slate-500 mt-1">Manage your course roster and post announcements.</p>
      </div>

      {msg.text && (
        <div className={`px-4 py-3 rounded-lg border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>{msg.text}</div>
      )}

      <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
        <option value="">Select a course…</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code}) — Batch {c.batch}</option>)}
      </select>

      {courseId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roster */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Users size={18} /> Roster</h2>
              <span className="text-sm text-slate-500">{roster.count} students</span>
            </div>
            {roster.students.length === 0 ? (
              <p className="text-slate-500 text-sm py-6 text-center">No students enrolled.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {roster.students.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-slate-700 font-medium">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.email} · Batch {s.batch}</p>
                    </div>
                    <button onClick={() => removeStudent(s.id)} className="text-red-500 hover:text-red-700 p-1" title="Remove">
                      <UserMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CSV / email enroll */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><UploadCloud size={16} /> Bulk enroll by email</h3>
              <textarea
                value={emails} onChange={(e) => setEmails(e.target.value)}
                rows={3} placeholder="Paste emails (comma / newline separated) or upload a CSV…"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex items-center gap-3 mt-2">
                <input type="file" accept=".csv,.txt" onChange={onFile} className="text-xs" />
                <button onClick={enroll} className="ml-auto bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm">Enroll</button>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><Megaphone size={18} /> Announcements</h2>
            <textarea
              value={newAnn} onChange={(e) => setNewAnn(e.target.value)}
              rows={3} placeholder="Write an announcement for this course…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={postAnnouncement} className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm">
              <Send size={15} /> Post
            </button>
            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto">
              {announcements.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No announcements yet.</p>
              ) : announcements.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <button onClick={() => delAnnouncement(a.id)} className="text-slate-400 hover:text-red-600 shrink-0"><Trash2 size={14} /></button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherRoster;
