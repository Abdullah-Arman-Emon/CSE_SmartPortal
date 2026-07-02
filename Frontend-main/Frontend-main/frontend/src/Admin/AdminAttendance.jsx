import { useState, useEffect } from "react";
import axios from "axios";
import { CalendarCheck, AlertTriangle, Users, Search, X } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function AdminAttendance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  // drill-down state
  const [detailCourse, setDetailCourse] = useState(null); // overview row
  const [report, setReport] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [detailView, setDetailView] = useState("summary"); // summary | register

  const load = () => {
    setLoading(true);
    const params = {};
    if (batch) params.batch = batch;
    if (semester) params.semester = semester;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (search.trim()) params.q = search.trim();
    axios
      .get(`${BACKEND_URL}/v1/attendance/overview`, { params })
      .then((res) => setRows(res.data || []))
      .catch((e) => console.error("overview", e))
      .finally(() => setLoading(false));
  };

  useEffect(load, [batch, semester, fromDate, toDate, search]);

  const openDetail = (r) => {
    setDetailCourse(r);
    setReport(null);
    setMatrix(null);
    setDetailView("summary");
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    Promise.all([
      axios.get(`${BACKEND_URL}/v1/attendance/course/${r.course_id}/report`, { params }),
      axios.get(`${BACKEND_URL}/v1/attendance/course/${r.course_id}/matrix`, { params }),
    ])
      .then(([rep, mat]) => {
        setReport(rep.data);
        setMatrix(mat.data);
      })
      .catch((e) => console.error("detail", e));
  };

  const batches = [...new Set(rows.map((r) => r.batch))].sort();
  const semesters = [...new Set(rows.map((r) => r.semester))];

  const pctColor = (p) => (p >= 75 ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-600");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
        <p className="text-gray-600 mt-1">Read-only department view — attendance is taken by course teachers. Click a course for the full report.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select value={batch} onChange={(e) => setBatch(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">All batches</option>
          {batches.map((b) => <option key={b} value={b}>Batch {b}</option>)}
        </select>
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">All semesters</option>
          {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        </div>
        {(fromDate || toDate || search || batch || semester) && (
          <button
            onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setBatch(""); setSemester(""); }}
            className="text-xs px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CalendarCheck size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No attendance data matches these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r) => (
            <button
              key={r.course_id}
              onClick={() => openDetail(r)}
              className={`text-left bg-white rounded-lg border p-5 shadow-sm hover:border-orange-400 hover:shadow transition ${
                detailCourse?.course_id === r.course_id ? "border-orange-500 ring-1 ring-orange-300" : "border-gray-200"
              }`}
            >
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
            </button>
          ))}
        </div>
      )}

      {/* Drill-down detail */}
      {detailCourse && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-gray-900">
                {detailCourse.course_title} ({detailCourse.course_code})
              </h3>
              <p className="text-sm text-gray-500">
                Batch {detailCourse.batch} · {detailCourse.semester}
                {(fromDate || toDate) && ` · ${fromDate || "…"} → ${toDate || "…"}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDetailView("summary")}
                className={`text-xs px-3 py-2 rounded-lg font-medium ${detailView === "summary" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Summary
              </button>
              <button
                onClick={() => setDetailView("register")}
                className={`text-xs px-3 py-2 rounded-lg font-medium ${detailView === "register" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                Date-wise Register
              </button>
              <button onClick={() => setDetailCourse(null)} className="text-gray-400 hover:text-gray-600 p-2">
                <X size={16} />
              </button>
            </div>
          </div>

          {!report || !matrix ? (
            <p className="text-gray-500 text-center py-8">Loading…</p>
          ) : detailView === "summary" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-center">Present</th>
                    <th className="px-4 py-2 text-center">Late</th>
                    <th className="px-4 py-2 text-center">Absent</th>
                    <th className="px-4 py-2 text-center">%</th>
                    <th className="px-4 py-2 text-center">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.students.map((s) => (
                    <tr key={s.student_id}>
                      <td className="px-4 py-2 text-gray-700">{s.name}</td>
                      <td className="px-4 py-2 text-center">{s.present}</td>
                      <td className="px-4 py-2 text-center">{s.late}</td>
                      <td className="px-4 py-2 text-center">{s.absent}</td>
                      <td className={`px-4 py-2 text-center font-bold ${s.eligible ? "text-green-600" : "text-red-600"}`}>{s.percentage}%</td>
                      <td className="px-4 py-2 text-center text-xs">
                        {s.eligible ? <span className="text-green-600">Eligible</span> : <span className="text-red-600">Not eligible</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : matrix.dates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance taken in this date range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left sticky left-0 bg-gray-50">Student</th>
                    {matrix.dates.map((d) => (
                      <th key={d} className="px-2 py-2 text-center whitespace-nowrap text-xs">{d.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matrix.students.map((s) => (
                    <tr key={s.student_id}>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap sticky left-0 bg-white">{s.name}</td>
                      {matrix.dates.map((d) => {
                        const st = s.marks[d];
                        const cls =
                          st === "present" ? "bg-green-100 text-green-700"
                          : st === "late" ? "bg-amber-100 text-amber-700"
                          : st === "absent" ? "bg-red-100 text-red-700"
                          : "bg-gray-50 text-gray-300";
                        const label = st === "present" ? "P" : st === "late" ? "L" : st === "absent" ? "A" : "—";
                        return (
                          <td key={d} className="px-1 py-1 text-center">
                            <span className={`inline-block w-7 py-1 rounded text-xs font-bold ${cls}`} title={st ? `${d}: ${st}` : d}>
                              {label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3">P = Present · L = Late · A = Absent · — = not taken</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminAttendance;
