import { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarCheck,
  ClipboardList,
  Save,
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const STATUS_CYCLE = ["present", "late", "absent"];
const STATUS_META = {
  present: { label: "Present", cls: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
  late: { label: "Late", cls: "bg-amber-100 text-amber-700 border-amber-300", icon: Clock },
  absent: { label: "Absent", cls: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
};

function TeacherAttendance({ teacherProfile }) {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [view, setView] = useState("mark"); // mark | report
  const [report, setReport] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [reportView, setReportView] = useState("summary"); // summary | register
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [riskOnly, setRiskOnly] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const selectedCourse = courses.find((c) => String(c.id) === String(courseId));

  useEffect(() => {
    if (!teacherProfile?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`)
      .then((res) => setCourses(res.data || []))
      .catch((e) => console.error("courses", e));
  }, [teacherProfile]);

  // Load students + existing marks whenever course/date changes
  useEffect(() => {
    if (!courseId) return;
    axios
      .get(`${BACKEND_URL}/v1/attendance/course/${courseId}/students`)
      .then(async (res) => {
        const studs = res.data || [];
        setStudents(studs);
        const existing = await axios.get(
          `${BACKEND_URL}/v1/attendance/course/${courseId}?date=${date}`
        );
        const map = {};
        studs.forEach((s) => (map[s.id] = "present"));
        (existing.data || []).forEach((r) => (map[r.student_id] = r.status));
        setMarks(map);
      })
      .catch((e) => console.error("students", e));
  }, [courseId, date]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const cycleStatus = (sid) =>
    setMarks((prev) => {
      const cur = prev[sid] || "present";
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
      return { ...prev, [sid]: next };
    });

  const markAll = (status) =>
    setMarks(() => Object.fromEntries(students.map((s) => [s.id, status])));

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/v1/attendance/mark`, {
        course_id: Number(courseId),
        date,
        records: students.map((s) => ({ student_id: s.id, status: marks[s.id] || "present" })),
      });
      flash("success", "Attendance saved.");
    } catch (e) {
      flash("error", e.response?.data?.detail || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const loadReport = async (from = fromDate, to = toDate, attempt = 0) => {
    if (!courseId) return flash("error", "Select a course first.");
    setView("report");
    const params = {};
    if (from) params.from_date = from;
    if (to) params.to_date = to;
    try {
      const rep = await axios.get(
        `${BACKEND_URL}/v1/attendance/course/${courseId}/report`,
        { params }
      );
      setReport(rep.data);
    } catch (e) {
      // one silent retry — covers server restarts / flaky connections
      if (attempt < 1) {
        setTimeout(() => loadReport(from, to, attempt + 1), 1500);
        return;
      }
      const why = e.response
        ? `${e.response.status}: ${e.response.data?.detail || e.response.statusText || "server error"}`
        : "network error — check your connection";
      flash("error", `Failed to load report (${why}).`);
      return;
    }
    // Register matrix is secondary — its failure must not block the summary
    try {
      const mat = await axios.get(
        `${BACKEND_URL}/v1/attendance/course/${courseId}/matrix`,
        { params }
      );
      setMatrix(mat.data);
    } catch {
      setMatrix(null);
    }
  };

  // Re-load report when the date window changes while viewing it
  useEffect(() => {
    if (view === "report" && courseId) loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const reportRows = report
    ? report.students.filter((s) => !riskOnly || !s.eligible)
    : [];

  const downloadCSV = () => {
    if (!report || !matrix) return;
    let csv;
    if (reportView === "summary") {
      csv = ["Student,Batch,Present,Late,Absent,Percentage,Eligible"]
        .concat(
          reportRows.map(
            (s) => `"${s.name}",${s.batch},${s.present},${s.late},${s.absent},${s.percentage},${s.eligible ? "Yes" : "No"}`
          )
        )
        .join("\n");
    } else {
      csv = ["Student,Batch," + matrix.dates.join(",")]
        .concat(
          matrix.students.map(
            (s) => `"${s.name}",${s.batch},` + matrix.dates.map((d) => s.marks[d] || "-").join(",")
          )
        )
        .join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${report.course_code}_${reportView}.csv`;
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
    const registerHead = matrix && matrix.dates.length
      ? `<tr><th>Student</th>${matrix.dates.map((d) => `<th style="text-align:center">${d.slice(5)}</th>`).join("")}</tr>`
      : "";
    const registerRows = matrix && matrix.dates.length
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="text-slate-500 mt-1">Take attendance and generate batch reports.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("mark")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "mark" ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            <CalendarCheck size={16} className="inline mr-1" /> Take Attendance
          </button>
          <button
            onClick={loadReport}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "report" ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-600"}`}
          >
            <ClipboardList size={16} className="inline mr-1" /> Report
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`px-4 py-3 rounded-lg border ${msg.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* Course + date selectors */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setReport(null); }}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title} ({c.code}) — Batch {c.batch}</option>
          ))}
        </select>
        {view === "mark" && (
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        )}
      </div>

      {!courseId ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Select a course to begin.
        </div>
      ) : view === "mark" ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-slate-500">Tap a student's badge to cycle Present → Late → Absent.</p>
            <div className="flex gap-2">
              <button onClick={() => markAll("present")} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">All present</button>
              <button onClick={() => markAll("absent")} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">All absent</button>
            </div>
          </div>

          {students.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No students enrolled in this course.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {students.map((s) => {
                const st = marks[s.id] || "present";
                const M = STATUS_META[st];
                const Icon = M.icon;
                return (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-700">{s.name}</p>
                      <p className="text-xs text-slate-400">Batch {s.batch}</p>
                    </div>
                    <button
                      onClick={() => cycleStatus(s.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${M.cls}`}
                    >
                      <Icon size={15} /> {M.label}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {students.length > 0 && (
            <button
              onClick={save} disabled={saving}
              className="mt-5 flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-5 py-2.5 rounded-lg"
            >
              <Save size={18} /> {saving ? "Saving…" : "Save Attendance"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {!report ? (
            <p className="text-slate-500 text-center py-8">Loading report…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">{report.course_title} ({report.course_code})</h3>
                  <p className="text-sm text-slate-500">Batch {report.batch} · {report.semester} · {report.total_sessions} sessions</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadCSV} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm">
                    <FileDown size={16} /> CSV
                  </button>
                  <button onClick={downloadPDF} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm">
                    <FileDown size={16} /> PDF
                  </button>
                </div>
              </div>

              {/* Filters + view toggle */}
              <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From date</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To date</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
                </div>
                {(fromDate || toDate) && (
                  <button onClick={() => { setFromDate(""); setToDate(""); }}
                    className="text-xs px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                    Clear dates
                  </button>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setReportView("summary")}
                    className={`text-xs px-3 py-2 rounded-lg font-medium ${reportView === "summary" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setReportView("register")}
                    className={`text-xs px-3 py-2 rounded-lg font-medium ${reportView === "register" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    Date-wise Register
                  </button>
                  {reportView === "summary" && (
                    <button
                      onClick={() => setRiskOnly((v) => !v)}
                      className={`text-xs px-3 py-2 rounded-lg font-medium ${riskOnly ? "bg-red-500 text-white" : "bg-red-50 text-red-600"}`}
                    >
                      At-risk only (&lt;75%)
                    </button>
                  )}
                </div>
              </div>

              {reportView === "summary" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Student</th>
                        <th className="px-4 py-2 text-center">Present</th>
                        <th className="px-4 py-2 text-center">Late</th>
                        <th className="px-4 py-2 text-center">Absent</th>
                        <th className="px-4 py-2 text-center">%</th>
                        <th className="px-4 py-2 text-center">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportRows.map((s) => (
                        <tr key={s.student_id}>
                          <td className="px-4 py-2 text-slate-700">{s.name}</td>
                          <td className="px-4 py-2 text-center">{s.present}</td>
                          <td className="px-4 py-2 text-center">{s.late}</td>
                          <td className="px-4 py-2 text-center">{s.absent}</td>
                          <td className={`px-4 py-2 text-center font-bold ${s.eligible ? "text-green-600" : "text-red-600"}`}>{s.percentage}%</td>
                          <td className="px-4 py-2 text-center">
                            {s.eligible ? (
                              <span className="text-green-600 text-xs">Eligible</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 text-xs">
                                <AlertTriangle size={12} /> Not eligible
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {reportRows.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No students match.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : !matrix || matrix.dates.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No attendance taken in this date range yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left sticky left-0 bg-slate-50">Student</th>
                        {matrix.dates.map((d) => (
                          <th key={d} className="px-2 py-2 text-center whitespace-nowrap text-xs">{d.slice(5)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matrix.students.map((s) => (
                        <tr key={s.student_id}>
                          <td className="px-4 py-2 text-slate-700 whitespace-nowrap sticky left-0 bg-white">{s.name}</td>
                          {matrix.dates.map((d) => {
                            const st = s.marks[d];
                            const cls =
                              st === "present" ? "bg-green-100 text-green-700"
                              : st === "late" ? "bg-amber-100 text-amber-700"
                              : st === "absent" ? "bg-red-100 text-red-700"
                              : "bg-slate-50 text-slate-300";
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
                  <p className="text-xs text-slate-400 mt-3">P = Present · L = Late · A = Absent · — = not taken</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherAttendance;
