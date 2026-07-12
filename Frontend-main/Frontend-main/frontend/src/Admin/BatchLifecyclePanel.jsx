import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { GraduationCap, PlusCircle, Archive, Users, RefreshCw } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Batch lifecycle control — the master view of every cohort and where it is in
 * its life. Admin admits a new batch (creates the Batch + its 1-1 term) and
 * graduates a whole batch (moves it + its students into the read-only alumni
 * archive). Semester-to-semester promotion still happens per-routine via the
 * "Close term & promote" button in the Routine Editor.
 */
const STATUS_STYLES = {
    active: "bg-green-50 text-green-700 border-green-200",
    graduated: "bg-indigo-50 text-indigo-700 border-indigo-200",
    archived: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function BatchLifecyclePanel({ adminId, flash }) {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ number: "", program: "bsc", admission_year: new Date().getFullYear() });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/v1/batches`);
            setBatches(res.data || []);
        } catch (e) {
            flash?.("error", e.response?.data?.detail || "Failed to load batches");
        } finally {
            setLoading(false);
        }
    }, [flash]);

    useEffect(() => { load(); }, [load]);

    const admit = async (e) => {
        e.preventDefault();
        if (!form.number) return flash?.("error", "Batch number required");
        try {
            const res = await axios.post(
                `${BACKEND_URL}/v1/batches/admin/admit?number=${form.number}` +
                `&program=${form.program}&admission_year=${form.admission_year}&user_id=${adminId}`
            );
            flash?.("success", res.data.message);
            setForm({ ...form, number: "" });
            load();
        } catch (err) {
            flash?.("error", err.response?.data?.detail || "Failed to admit batch");
        }
    };

    const graduate = async (b) => {
        if (!window.confirm(
            `Graduate Batch ${b.number}?\n\nThis marks the whole batch and its ` +
            `${b.student_counts.active} active student(s) as graduated (read-only alumni), ` +
            `finalises their transcripts and closes its courses. This cannot be undone.`
        )) return;
        try {
            const res = await axios.put(`${BACKEND_URL}/v1/batches/admin/${b.number}/graduate?user_id=${adminId}`);
            flash?.("success", `${res.data.message} — ${res.data.students_graduated} student(s) → alumni.`);
            load();
        } catch (err) {
            flash?.("error", err.response?.data?.detail || "Failed to graduate batch");
        }
    };

    const archive = async (b) => {
        if (!window.confirm(`Archive Batch ${b.number}? It will be hidden from active lists (data stays).`)) return;
        try {
            await axios.put(`${BACKEND_URL}/v1/batches/admin/${b.number}/archive?user_id=${adminId}`);
            flash?.("success", `Batch ${b.number} archived`);
            load();
        } catch (err) {
            flash?.("error", err.response?.data?.detail || "Failed to archive");
        }
    };

    return (
        <div className="space-y-6">
            {/* Admit a new batch */}
            <form onSubmit={admit} className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500">Batch number</label>
                    <input type="number" value={form.number}
                        onChange={(e) => setForm({ ...form, number: e.target.value })}
                        placeholder="e.g. 32"
                        className="mt-1 w-28 border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500">Program</label>
                    <select value={form.program}
                        onChange={(e) => setForm({ ...form, program: e.target.value })}
                        className="mt-1 border rounded-lg px-3 py-2 text-sm">
                        <option value="bsc">B.Sc</option>
                        <option value="msc">M.Sc</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500">Admission year</label>
                    <input type="number" value={form.admission_year}
                        onChange={(e) => setForm({ ...form, admission_year: e.target.value })}
                        className="mt-1 w-28 border rounded-lg px-3 py-2 text-sm" />
                </div>
                <button type="submit"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
                    <PlusCircle size={16} /> Admit batch
                </button>
                <button type="button" onClick={load}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-slate-500 text-sm hover:bg-slate-50">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </form>

            {/* Batch cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {batches.length === 0 && !loading && (
                    <p className="text-slate-400 text-sm col-span-full">No batches yet — admit one above.</p>
                )}
                {batches.map((b) => (
                    <div key={b.number} className="bg-white border rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-800">
                                Batch {b.number}
                                <span className="ml-2 text-xs font-normal text-slate-400 uppercase">{b.program}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[b.status] || ""}`}>
                                {b.status}
                            </span>
                        </div>
                        <div className="text-sm text-slate-500 space-y-1">
                            <div>Current semester: <b className="text-slate-700">{b.current_semester || "—"}</b></div>
                            <div className="flex items-center gap-1">
                                <Users size={14} />
                                {b.student_counts.active} active · {b.student_counts.graduated} alumni
                            </div>
                            {b.admission_year && <div className="text-xs text-slate-400">Admitted {b.admission_year}</div>}
                        </div>
                        <div className="flex gap-2 pt-1">
                            {b.status === "active" && (
                                <button onClick={() => graduate(b)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100">
                                    <GraduationCap size={14} /> Graduate batch
                                </button>
                            )}
                            {b.status === "graduated" && (
                                <button onClick={() => archive(b)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-slate-500 text-xs hover:bg-slate-50">
                                    <Archive size={14} /> Archive
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
