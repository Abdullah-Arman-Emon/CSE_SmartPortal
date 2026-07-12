import { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarCheck, AlertTriangle, Users, Search, X, FileDown,
  SlidersHorizontal, TrendingUp, BookOpen, ShieldCheck,
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle, Clock3,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAGE_SIZE = 9;

const STATUS_META = {
  active: { label: "Active", cls: "bg-green-100 text-green-700", icon: PlayCircle },
  completed: { label: "Completed", cls: "bg-slate-200 text-slate-600", icon: CheckCircle2 },
  upcoming: { label: "Upcoming", cls: "bg-amber-100 text-amber-700", icon: Clock3 },
};

function AdminAttendance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState("all"); // all | risk | healthy
  const [status, setStatus] = useState("all"); // all | active | completed | upcoming
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // drill-down state
  const [detailCourse, setDetailCourse] = useState(null); // overview row
  const [report, setReport] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [detailView, setDetailView] = useState("summary"); // summary | register
  const [detailError, setDetailError] = useState("");

  const load = () => {
    setLoading(true);
    const params = {};
    if (batch) params.batch = batch;
    if (semester) params.semester = semester;
    if (status !== "all") params.status = status;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (search.trim()) params.q = search.trim();
    axios
      .get(`${BACKEND_URL}/v1/attendance/overview`, { params })
      .then((res) => setRows(res.data || []))
      .catch((e) => console.error("overview", e))
      .finally(() => setLoading(false));
  };

  useEffect(load, [batch, semester, status, fromDate, toDate, search]);

  // lock body scroll while the detail modal is open
  useEffect(() => {
    document.body.style.overflow = detailCourse ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailCourse]);

  const openDetail = (r) => {
    setDetailCourse(r);
    setReport(null);
    setMatrix(null);
    setDetailView("summary");
    setDetailError("");
    const params = {};
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    // Report is primary; the register/matrix is secondary and must not block it.
    axios
      .get(`${BACKEND_URL}/v1/attendance/course/${r.course_id}/report`, { params })
      .then((rep) => setReport(rep.data))
      .catch((e) => {
        console.error("detail report", e);
        const why = e.response
          ? `${e.response.status}: ${e.response.data?.detail || e.response.statusText || "server error"}`
          : "network error";
        setDetailError(`Failed to load report (${why}).`);
      });
    axios
      .get(`${BACKEND_URL}/v1/attendance/course/${r.course_id}/matrix`, { params })
      .then((mat) => setMatrix(mat.data))
      .catch(() => setMatrix({ dates: [], students: [] }));
  };

  const closeDetail = () => setDetailCourse(null);

  const downloadCSV = () => {
    if (!report) return;
    let csv;
    if (detailView === "register" && matrix && matrix.dates.length) {
      csv = ["Student,Batch," + matrix.dates.join(",")]
        .concat(
          matrix.students.map(
            (s) => `"${s.name}",${s.batch},` + matrix.dates.map((d) => s.marks[d] || "-").join(",")
          )
        )
        .join("\n");
    } else {
      csv = ["Student,Batch,Present,Late,Absent,Percentage,Eligible"]
        .concat(
          report.students.map(
            (s) => `"${s.name}",${s.batch},${s.present},${s.late},${s.absent},${s.percentage},${s.eligible ? "Yes" : "No"}`
          )
        )
        .join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${report.course_code}_${detailView}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPDF = () => {
    if (!report) return;
    const rows = report.students
      .map(
        (s) => `<tr>
          <td>${s.name}</td><td>${s.batch}</td>
          <td style="text-align:center">${s.present}</td>
          <td style="text-align:center">${s.late}</td>
          <td style="text-align:center">${s.absent}</td>
          <td style="text-align:center;font-weight:bold;color:${s.eligible ? "#16a34a" : "#dc2626"}">${s.percentage}%</td>
          <td style="text-align:center">${s.eligible ? "Eligible" : "Not eligible"}</td>
        </tr>`
      )
      .join("");
    const STATUS_CHAR = { present: "P", late: "L", absent: "A" };
    const hasReg = matrix && matrix.dates.length;
    const registerHead = hasReg
      ? `<tr><th>Student</th>${matrix.dates.map((d) => `<th style="text-align:center">${d.slice(5)}</th>`).join("")}</tr>`
      : "";
    const registerRows = hasReg
      ? matrix.students
          .map(
            (s) => `<tr><td>${s.name}</td>${matrix.dates
              .map((d) => {
                const st = s.marks[d];
                const color = st === "present" ? "#16a34a" : st === "late" ? "#d97706" : st === "absent" ? "#dc2626" : "#94a3b8";
                return `<td style="text-align:center;color:${color};font-weight:bold">${STATUS_CHAR[st] || "—"}</td>`;
              })
              .join("")}</tr>`
          )
          .join("")
      : "";
    const window_label = fromDate || toDate ? ` · Window: ${fromDate || "…"} → ${toDate || "…"}` : "";
    const html = `<!doctype html><html><head><title>Attendance Report</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;font-weight:normal;color:#64748b;margin:0 0 16px}
      h3{font-size:15px;margin:24px 0 8px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #e2e8f0;padding:8px}th{background:#f8fafc;text-align:left}</style></head>
      <body>
        <h1>Attendance Report — ${report.course_title} (${report.course_code})</h1>
        <h2>Batch ${report.batch} · ${report.semester} · Total sessions: ${report.total_sessions}${window_label} · Generated ${new Date().toLocaleDateString()}</h2>
        <table><thead><tr><th>Student</th><th>Batch</th><th>Present</th><th>Late</th><th>Absent</th><th>Attendance %</th><th>Exam eligibility (≥75%)</th></tr></thead>
        <tbody>${rows}</tbody></table>
        ${registerRows ? `<h3>Date-wise Register (P=Present, L=Late, A=Absent)</h3><table><thead>${registerHead}</thead><tbody>${registerRows}</tbody></table>` : ""}
      </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const batches = [...new Set(rows.map((r) => r.batch))].sort();
  const semesters = [...new Set(rows.map((r) => r.semester))];

  const visibleRows = rows.filter((r) => {
    if (health === "risk") return r.at_risk > 0 || r.avg_percentage < 75;
    if (health === "healthy") return r.at_risk === 0 && r.avg_percentage >= 75;
    return true;
  });

  // batch-wise total classes held (sum of course sessions per batch)
  const batchSessions = {};
  visibleRows.forEach((r) => {
    batchSessions[r.batch] = (batchSessions[r.batch] || 0) + (r.total_sessions || 0);
  });

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = visibleRows.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [batch, semester, status, health, search, fromDate, toDate]);

  const pctColor = (p) => (p >= 75 ? "text-green-600" : p >= 60 ? "text-amber-600" : "text-red-600");
  const pctBar = (p) => (p >= 75 ? "bg-green-500" : p >= 60 ? "bg-amber-500" : "bg-red-500");

  // KPI roll-up across visible courses
  const kpi = {
    courses: visibleRows.length,
    students: visibleRows.reduce((s, r) => s + (r.enrolled || 0), 0),
    atRisk: visibleRows.reduce((s, r) => s + (r.at_risk || 0), 0),
    avg: visibleRows.length
      ? Math.round(visibleRows.reduce((s, r) => s + (r.avg_percentage || 0), 0) / visibleRows.length)
      : 0,
  };

  const activeFilters = [fromDate, toDate, search, batch, semester].filter(Boolean).length
    + (health !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Read-only department view — attendance is taken by course teachers. Click a course for the full report.
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
            showFilters || activeFilters
              ? "bg-orange-50 border-orange-300 text-orange-700"
              : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-orange-500 text-white text-[10px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* KPI strip — everything at a glance, no scrolling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, label: "Courses", value: kpi.courses, tint: "text-sky-600 bg-sky-50" },
          { icon: Users, label: "Students", value: kpi.students, tint: "text-indigo-600 bg-indigo-50" },
          { icon: TrendingUp, label: "Avg attendance", value: `${kpi.avg}%`, tint: `${pctColor(kpi.avg)} bg-gray-50` },
          { icon: AlertTriangle, label: "At-risk students", value: kpi.atRisk, tint: "text-red-600 bg-red-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.tint}`}>
              <k.icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status separation (active / completed) + batch-wise class totals */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All courses" },
          { key: "active", label: "Active" },
          { key: "completed", label: "Completed" },
          { key: "upcoming", label: "Upcoming" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatus(s.key)}
            className={`text-sm px-3.5 py-1.5 rounded-full font-medium transition ${
              status === s.key ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s.label}
          </button>
        ))}
        {Object.keys(batchSessions).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <span className="text-xs text-gray-400">Classes held:</span>
            {Object.entries(batchSessions).sort((a, b) => b[0] - a[0]).map(([b, n]) => (
              <span key={b} className="text-xs bg-sky-50 text-sky-700 rounded-full px-2.5 py-1">
                Batch {b}: <b>{n}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Filters — collapsible, responsive grid */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <Search size={15} className="absolute left-3 top-[30px] text-gray-400" />
              <input
                placeholder="Course name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Batch</label>
              <select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">All batches</option>
                {batches.map((b) => <option key={b} value={b}>Batch {b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">All semesters</option>
                {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-gray-400">Health:</span>
            {[
              { key: "all", label: "All courses" },
              { key: "risk", label: "At-risk" },
              { key: "healthy", label: "Healthy" },
            ].map((h) => (
              <button
                key={h.key}
                onClick={() => setHealth(h.key)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  health === h.key
                    ? h.key === "risk" ? "bg-red-500 text-white"
                      : h.key === "healthy" ? "bg-green-600 text-white"
                      : "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {h.label}
              </button>
            ))}
            {activeFilters > 0 && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setSearch(""); setBatch(""); setSemester(""); setHealth("all"); setStatus("all"); }}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 ml-auto"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse space-y-4">
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CalendarCheck size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No attendance data matches these filters.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageRows.map((r) => {
            const sm = STATUS_META[r.status] || STATUS_META.active;
            return (
            <button
              key={r.course_id}
              onClick={() => openDetail(r)}
              className="text-left bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-orange-400 hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${sm.cls}`}>
                      <sm.icon size={11} /> {sm.label}
                    </span>
                    {r.at_risk > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> {r.at_risk} at risk
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{r.course_title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{r.course_code} · Batch {r.batch} · {r.semester}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-500">Avg attendance</p>
                  <p className={`text-3xl font-bold ${pctColor(r.avg_percentage)}`}>{r.avg_percentage}%</p>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-0.5">
                  <p className="flex items-center gap-1 justify-end"><Users size={13} /> {r.enrolled} enrolled</p>
                  <p>{r.total_sessions} sessions</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pctBar(r.avg_percentage)}`} style={{ width: `${Math.min(r.avg_percentage, 100)}%` }} />
              </div>
            </button>
          );})}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium ${p === pageSafe ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}
              className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        </>
      )}

      {/* Drill-down detail — modal overlay (no page scroll) */}
      {detailCourse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative bg-white w-full sm:max-w-5xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh]">
            {/* sticky header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {(() => { const sm = STATUS_META[detailCourse.status] || STATUS_META.active; return (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${sm.cls}`}>
                      <sm.icon size={11} /> {sm.label}
                    </span>
                  ); })()}
                </div>
                <h3 className="font-bold text-gray-900 truncate">
                  {detailCourse.course_title} <span className="text-gray-400 font-normal">({detailCourse.course_code})</span>
                </h3>
                <p className="text-sm text-gray-500">
                  Batch {detailCourse.batch} · {detailCourse.semester}
                  {(fromDate || toDate) && ` · ${fromDate || "…"} → ${toDate || "…"}`}
                  {report && ` · ${report.total_sessions} sessions`}
                </p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* sticky toolbar: view toggle + downloads */}
            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="inline-flex rounded-lg bg-white border border-gray-200 p-0.5">
                <button
                  onClick={() => setDetailView("summary")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${detailView === "summary" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setDetailView("register")}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${detailView === "register" ? "bg-orange-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  Date-wise Register
                </button>
              </div>
              {report && (
                <div className="flex gap-2 ml-auto">
                  <button onClick={downloadCSV} className="flex items-center gap-1.5 text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg">
                    <FileDown size={14} /> CSV
                  </button>
                  <button onClick={downloadPDF} className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg">
                    <FileDown size={14} /> PDF
                  </button>
                </div>
              )}
            </div>

            {/* scrollable body */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailError ? (
                <div className="text-center py-10">
                  <AlertTriangle size={32} className="mx-auto text-red-400 mb-2" />
                  <p className="text-red-600">{detailError}</p>
                  <button
                    onClick={() => openDetail(detailCourse)}
                    className="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600"
                  >
                    Retry
                  </button>
                </div>
              ) : !report ? (
                <div className="space-y-2 animate-pulse py-2">
                  {[...Array(6)].map((_, i) => <div key={i} className="h-9 bg-gray-100 rounded" />)}
                </div>
              ) : detailView === "summary" ? (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium">Student</th>
                        <th className="px-3 py-2.5 text-center font-medium">Present</th>
                        <th className="px-3 py-2.5 text-center font-medium">Late</th>
                        <th className="px-3 py-2.5 text-center font-medium">Absent</th>
                        <th className="px-3 py-2.5 text-center font-medium">%</th>
                        <th className="px-3 py-2.5 text-center font-medium">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report.students.map((s) => (
                        <tr key={s.student_id} className="hover:bg-orange-50/40">
                          <td className="px-4 py-2.5 text-gray-800 font-medium whitespace-nowrap">{s.name}</td>
                          <td className="px-3 py-2.5 text-center text-green-700">{s.present}</td>
                          <td className="px-3 py-2.5 text-center text-amber-600">{s.late}</td>
                          <td className="px-3 py-2.5 text-center text-red-600">{s.absent}</td>
                          <td className={`px-3 py-2.5 text-center font-bold ${s.eligible ? "text-green-600" : "text-red-600"}`}>{s.percentage}%</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.eligible ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                              {s.eligible ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                              {s.eligible ? "Eligible" : "Not eligible"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !matrix || matrix.dates.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No attendance taken in this date range.</p>
              ) : (
                <div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="text-sm border-collapse">
                      <thead className="bg-gray-50">
                        {/* year band — groups the date columns by year */}
                        {(() => {
                          const groups = [];
                          matrix.dates.forEach((d) => {
                            const y = d.slice(0, 4);
                            const last = groups[groups.length - 1];
                            if (last && last.year === y) last.count += 1;
                            else groups.push({ year: y, count: 1 });
                          });
                          return (
                            <tr>
                              <th className="px-4 py-1.5 sticky left-0 bg-gray-50 z-10" />
                              {groups.map((g, i) => (
                                <th key={g.year + i} colSpan={g.count}
                                  className="px-2 py-1.5 text-center text-xs font-semibold text-gray-600 border-l border-gray-200">
                                  {g.year}
                                </th>
                              ))}
                            </tr>
                          );
                        })()}
                        <tr>
                          <th className="px-4 py-2 text-left sticky left-0 bg-gray-50 text-gray-500 font-medium z-10">Student</th>
                          {matrix.dates.map((d) => (
                            <th key={d} className="px-2 py-2 text-center whitespace-nowrap text-xs text-gray-500">{d.slice(5)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {matrix.students.map((s) => (
                          <tr key={s.student_id} className="hover:bg-orange-50/40">
                            <td className="px-4 py-2 text-gray-800 font-medium whitespace-nowrap sticky left-0 bg-white z-10">{s.name}</td>
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
                  </div>
                  <p className="text-xs text-gray-400 mt-3">P = Present · L = Late · A = Absent · — = not taken</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAttendance;
