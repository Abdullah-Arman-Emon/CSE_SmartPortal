import { useState, useEffect } from "react";
import axios from "axios";
import { CalendarCheck, AlertTriangle, Users } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function AdminAttendance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");

  const load = () => {
    setLoading(true);
    const params = [];
    if (batch) params.push(`batch=${batch}`);
    if (semester) params.push(`semester=${encodeURIComponent(semester)}`);
    axios
      .get(`${BACKEND_URL}/v1/attendance/overview${params.length ? "?" + params.join("&") : ""}`)
      .then((res) => setRows(res.data || []))
      .catch((e) => console.error("overview", e))
      .finally(() => setLoading(false));
  };

  useEffect(load, [batch, semester]);

  const batches = [...new Set(rows.map((r) => r.batch))].sort();
  const semesters = [...new Set(rows.map((r) => r.semester))];

  const pctColor = (p) => (p >= 75 ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-600");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
        <p className="text-gray-600 mt-1">Read-only department view — attendance is taken by course teachers.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <select value={batch} onChange={(e) => setBatch(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">All batches</option>
          {batches.map((b) => <option key={b} value={b}>Batch {b}</option>)}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">All semesters</option>
          {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarCheck size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No attendance data yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => (
            <div key={r.course_id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{r.course_title}</h3>
                  <p className="text-xs text-gray-500">{r.course_code} · Batch {r.batch} · {r.semester}</p>
                </div>
                {r.at_risk > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle size={12} /> {r.at_risk} at risk
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">Avg attendance</p>
                  <p className={`text-3xl font-bold ${pctColor(r.avg_percentage)}`}>{r.avg_percentage}%</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p className="flex items-center gap-1 justify-end"><Users size={14} /> {r.enrolled} enrolled</p>
                  <p>{r.total_sessions} sessions</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminAttendance;
