import { useState, useEffect } from "react";
import axios from "axios";
import { CalendarCheck, Save, Activity } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function AdminAttendance() {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    percentage: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/v1/student/dashboard/all_students`)
      .then((res) => setStudents(res.data || []))
      .catch((err) => console.error("students", err));
  }, []);

  const loadRecords = (studentId) => {
    if (!studentId) return setRecords([]);
    axios
      .get(`${BACKEND_URL}/v1/student/dashboard/missing_classes/${studentId}`)
      .then((res) => setRecords(res.data || []))
      .catch(() => setRecords([]));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "student_id") loadRecords(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_id || form.percentage === "") {
      setMessage({ type: "error", text: "Select a student and enter a percentage." });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await axios.post(
        `${BACKEND_URL}/v1/student/dashboard/missing_classes` +
          `?student_id=${form.student_id}&month=${form.month}` +
          `&year=${form.year}&percentage=${form.percentage}`
      );
      setMessage({ type: "success", text: "Attendance recorded." });
      loadRecords(form.student_id);
      setForm((prev) => ({ ...prev, percentage: "" }));
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to record." });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-600 mt-1">Record monthly missing-class percentage per student.</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record form */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CalendarCheck className="text-orange-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Record Attendance</h2>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Student</label>
              <select name="student_id" value={form.student_id} onChange={handleChange} className={inputCls}>
                <option value="">Select a student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — Batch {s.batch}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Month</label>
              <select name="month" value={form.month} onChange={handleChange} className={inputCls}>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Year</label>
              <input type="number" name="year" value={form.year} onChange={handleChange} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Missing-class percentage (%)</label>
              <input
                type="number" name="percentage" min="0" max="100"
                value={form.percentage} onChange={handleChange}
                placeholder="e.g., 12" className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit" disabled={saving}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg transition-colors"
              >
                <Save size={18} />
                {saving ? "Saving…" : "Save Record"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing records for selected student */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Activity className="text-emerald-600" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Records</h2>
          </div>
          {!form.student_id ? (
            <p className="text-gray-500 text-sm">Select a student to view records.</p>
          ) : records.length === 0 ? (
            <p className="text-gray-500 text-sm">No records for this student yet.</p>
          ) : (
            <ul className="space-y-2">
              {records.map((r, i) => (
                <li key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{r.month} {r.year}</span>
                  <span className="text-sm font-bold text-orange-600">{r.percentage_classes}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAttendance;
