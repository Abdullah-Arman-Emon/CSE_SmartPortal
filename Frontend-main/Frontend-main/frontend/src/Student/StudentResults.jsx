import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { FileDown, GraduationCap } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const GRADE_COLOR = {
  "A+": "text-green-600", A: "text-green-600", "A-": "text-green-600",
  "B+": "text-amber-600", B: "text-amber-600", "B-": "text-amber-600",
  "C+": "text-orange-600", C: "text-orange-600",
  D: "text-red-500", F: "text-red-600",
};

function StudentResults() {
  const { user } = useContext(AuthContext);
  const [studentId, setStudentId] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/auth/get/student`, { params: { user_id: user.id } })
      .then((res) => setStudentId(res.data?.id))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!studentId) return;
    axios
      .get(`${BACKEND_URL}/v1/results/student/${studentId}`)
      .then((res) => setResults(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const totalCredits = results.reduce((sum, r) => sum + (r.credit || 0), 0);
  const totalQuality = results.reduce((sum, r) => sum + (r.credit || 0) * (r.grade_point || 0), 0);
  const cgpa = totalCredits ? totalQuality / totalCredits : 0;

  const downloadTranscript = () => {
    const rows = results
      .map(
        (r) => `<tr>
          <td>${r.course_title}</td><td>${r.course_code}</td><td style="text-align:center">${r.credit}</td>
          <td style="text-align:center">${r.semester}</td>
          <td style="text-align:center;font-weight:bold">${r.grade}</td>
          <td style="text-align:center">${r.grade_point?.toFixed(2)}</td>
        </tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><title>Transcript</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:14px;font-weight:normal;color:#64748b;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th,td{border:1px solid #e2e8f0;padding:8px}th{background:#f8fafc;text-align:left}</style></head>
      <body>
        <h1>Academic Transcript</h1>
        <h2>University of Dhaka · Department of CSE · Generated ${new Date().toLocaleDateString()}</h2>
        <table><thead><tr><th>Course</th><th>Code</th><th>Credit</th><th>Semester</th><th>Grade</th><th>Grade Point</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p style="margin-top:16px;font-weight:bold">Cumulative CGPA: ${cgpa.toFixed(2)} (${totalCredits} credits)</p>
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap size={24} /> Results
          </h1>
          <p className="text-slate-500 mt-1">Published results and cumulative CGPA.</p>
        </div>
        {results.length > 0 && (
          <button onClick={downloadTranscript} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm">
            <FileDown size={16} /> Download Transcript
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading…</p>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No published results yet.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between">
            <span className="text-slate-600">Cumulative CGPA ({totalCredits} credits)</span>
            <span className="text-3xl font-black text-indigo-600">{cgpa.toFixed(2)}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Course</th>
                  <th className="px-4 py-2 text-center">Credit</th>
                  <th className="px-4 py-2 text-center">Semester</th>
                  <th className="px-4 py-2 text-center">Grade</th>
                  <th className="px-4 py-2 text-center">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.course_id}>
                    <td className="px-4 py-2 text-slate-700">{r.course_title} <span className="text-slate-400 text-xs">({r.course_code})</span></td>
                    <td className="px-4 py-2 text-center">{r.credit}</td>
                    <td className="px-4 py-2 text-center">{r.semester}</td>
                    <td className={`px-4 py-2 text-center font-bold ${GRADE_COLOR[r.grade] || "text-slate-400"}`}>{r.grade}</td>
                    <td className="px-4 py-2 text-center">{r.grade_point?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default StudentResults;
