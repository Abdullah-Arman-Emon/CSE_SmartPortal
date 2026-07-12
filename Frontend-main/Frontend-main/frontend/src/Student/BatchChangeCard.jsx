import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ArrowLeftRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SEMESTERS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

// Student self-service: request to move batch/semester (year drop "Dead",
// readmission, retaking a full semester with a junior batch). Admin approves.
export default function BatchChangeCard() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const load = () => {
    if (!user?.id) return;
    axios.get(`${BACKEND_URL}/v1/batch-change/my?user_id=${user.id}`)
      .then((r) => setRequests(r.data || []))
      .catch(() => {});
  };
  useEffect(load, [user]);

  const pending = requests.find((r) => r.status === "pending");

  const submit = async () => {
    if (!batch || !semester) return flash("error", "Choose the batch and semester you want to move to.");
    try {
      await axios.post(`${BACKEND_URL}/v1/batch-change/request?user_id=${user.id}`, {
        to_batch: Number(batch), to_semester: semester, reason: reason || null,
      });
      setOpen(false); setBatch(""); setSemester(""); setReason("");
      flash("success", "Request sent — an admin will review it.");
      load();
    } catch (e) {
      flash("error", e.response?.data?.detail || "Failed to send request");
    }
  };

  const statusChip = (s) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      s === "approved" ? "bg-green-100 text-green-700"
      : s === "rejected" ? "bg-red-100 text-red-600"
      : "bg-amber-100 text-amber-700"}`}>
      {s === "approved" ? <CheckCircle2 size={12} /> : s === "rejected" ? <XCircle size={12} /> : <Clock size={12} />}
      {s}
    </span>
  );

  return (
    <div className="mt-6 bg-white border rounded-xl p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <ArrowLeftRight size={18} className="text-indigo-600" /> Change batch / semester
        </h3>
        {!pending && (
          <button onClick={() => setOpen((o) => !o)}
            className="text-sm px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            {open ? "Cancel" : "Request change"}
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Dropped a year, returning after a break, or retaking a full semester with a junior batch?
        Request a move here — your past results stay on your transcript.
      </p>

      {msg.text && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      {pending && (
        <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pending request to Batch {pending.to_batch} ({pending.to_semester}) — waiting for admin approval.
        </div>
      )}

      {open && !pending && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <label className="block text-sm">
            <span className="text-slate-600">Target batch</span>
            <input type="number" value={batch} onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g. 28" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Target semester</span>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">— choose —</option>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Reason</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="optional" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-3">
            <button onClick={submit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">
              Send request
            </button>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-4 space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm text-slate-600 border-t pt-2">
              {statusChip(r.status)}
              <span>→ Batch {r.to_batch} ({r.to_semester})</span>
              {r.decided_note && <span className="text-xs text-slate-400">· {r.decided_note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
