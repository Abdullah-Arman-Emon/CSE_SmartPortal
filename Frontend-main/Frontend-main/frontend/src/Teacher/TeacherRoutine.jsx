import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
    CalendarClock, ArrowLeftRight, MoveRight, X, Send,
    CheckCircle2, XCircle, RefreshCw, AlertTriangle,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

// My weekly routine + reschedule workflow:
//  - "Move" → pick a genuinely free cell → request goes to admin for approval
//  - "Swap" → pick another teacher's class → THEY accept → applied automatically
function TeacherRoutine({ teacherProfile }) {
    const { user } = useContext(AuthContext);
    const teacherId = teacherProfile?.id;

    const [slots, setSlots] = useState([]);
    const [timeline, setTimeline] = useState([]); // terms this teacher taught in
    const [periods, setPeriods] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState({ type: "", text: "" });

    // move modal: {slot, matrix, chosen: {day, period_id}, room, reason}
    const [moveModal, setMoveModal] = useState(null);
    // swap modal: {slot, targetTeacher, targetSlots, targetSlotId, reason}
    const [swapModal, setSwapModal] = useState(null);

    const flash = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    };

    const load = useCallback(async () => {
        if (!teacherId) return;
        // Resilient load: each part is independent, so one failing call never
        // blanks the whole page — and the flash names exactly which call + status
        // failed instead of a useless "Could not load your routine".
        const calls = {
            slots: `/v1/routine/teacher/${teacherId}/slots`,
            periods: `/v1/routine/periods`,
            teachers: `/v1/routine/teachers`,
            requests: `/v1/routine/requests?teacher_id=${teacherId}`,
            timeline: `/v1/routine/teacher/timeline?teacher_id=${teacherId}`,
        };
        const keys = Object.keys(calls);
        const results = await Promise.allSettled(
            keys.map((k) => axios.get(`${BACKEND_URL}${calls[k]}`))
        );
        const failed = [];
        results.forEach((res, i) => {
            const key = keys[i];
            if (res.status === "fulfilled") {
                const d = res.value.data;
                if (key === "slots") setSlots(Array.isArray(d) ? d : []);
                else if (key === "periods") setPeriods(Array.isArray(d) ? d : []);
                else if (key === "teachers") setTeachers((Array.isArray(d) ? d : []).filter((x) => x.teacher_id !== teacherId));
                else if (key === "requests") setRequests(Array.isArray(d) ? d : []);
                else if (key === "timeline") setTimeline(d?.terms || []);
            } else {
                const st = res.reason?.response?.status;
                failed.push(`${key}${st ? ` (${st})` : " (network)"}`);
            }
        });
        if (failed.length) {
            flash("error", `Routine partly failed to load — ${failed.join(", ")}. `
                + (failed.some((f) => f.includes("404"))
                    ? "The backend may be running old code — restart it."
                    : "Check the backend logs for that request."));
        }
    }, [teacherId]);

    useEffect(() => { load(); }, [load]);

    const slotsAt = (day, periodId) =>
        slots.filter((s) => s.day === day && s.period_id === periodId);

    // ---------- move ----------
    const openMove = async (slot) => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/v1/routine/availability?routine_id=${slot.routine_id}` +
                `&teacher_ids=${(slot.teacher_ids || []).join(",")}` +
                (slot.room ? `&room=${encodeURIComponent(slot.room)}` : "") +
                (slot.group_label ? `&group_label=${slot.group_label}` : "") +
                `&exclude_slot_id=${slot.id}`
            );
            setMoveModal({ slot, matrix: res.data.matrix, chosen: null, room: slot.room || "", reason: "" });
        } catch {
            flash("error", "Could not load free slots");
        }
    };

    const sendMove = async () => {
        const { slot, chosen, room, reason } = moveModal;
        try {
            await axios.post(`${BACKEND_URL}/v1/routine/requests?teacher_id=${teacherId}`, {
                slot_id: slot.id, type: "move",
                proposed_day: chosen.day, proposed_period_id: chosen.period_id,
                proposed_room: room || null, reason: reason || null,
            });
            setMoveModal(null);
            flash("success", "Move request sent to admin — you'll be notified once approved.");
            load();
        } catch (e) {
            const d = e.response?.data?.detail;
            flash("error", d?.conflicts ? d.conflicts.join("; ") : (d || "Failed"));
        }
    };

    // ---------- swap ----------
    const openSwap = (slot) => setSwapModal({ slot, targetTeacher: "", targetSlots: [], targetSlotId: "", reason: "" });

    const pickSwapTeacher = async (tid) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/v1/routine/teacher/${tid}/slots`);
            setSwapModal((m) => ({ ...m, targetTeacher: tid, targetSlots: res.data, targetSlotId: "" }));
        } catch {
            flash("error", "Could not load that teacher's classes");
        }
    };

    const sendSwap = async () => {
        try {
            await axios.post(`${BACKEND_URL}/v1/routine/requests?teacher_id=${teacherId}`, {
                slot_id: swapModal.slot.id, type: "swap",
                target_slot_id: Number(swapModal.targetSlotId),
                reason: swapModal.reason || null,
            });
            setSwapModal(null);
            flash("success", "Swap proposed — the routine updates automatically when they accept.");
            load();
        } catch (e) {
            const d = e.response?.data?.detail;
            flash("error", d?.conflicts ? d.conflicts.join("; ") : (d || "Failed"));
        }
    };

    // ---------- decide ----------
    const decide = async (req, action) => {
        try {
            await axios.put(`${BACKEND_URL}/v1/routine/requests/${req.id}/${action}?user_id=${user?.id}`);
            flash("success", action === "accept"
                ? "Swap accepted — routine updated, students and admin notified."
                : action === "decline" ? "Request declined." : "Request cancelled.");
            load();
        } catch (e) {
            const d = e.response?.data?.detail;
            flash("error", d?.conflicts ? `Cannot apply now — ${d.conflicts.join("; ")}` : (d || "Failed"));
        }
    };

    const incoming = requests.filter((r) => r.incoming && r.status === "pending_teacher");
    const outgoing = requests.filter((r) => !r.incoming);

    const statusChip = (s) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            s === "applied" ? "bg-green-100 text-green-700"
            : s.startsWith("pending") ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-500"}`}>{s}</span>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarClock className="text-amber-600" /> My Routine
                </h2>
                <p className="text-slate-500 text-sm">
                    Your weekly classes across all batches. Request a <b>move</b> to a free slot (admin
                    approves) or propose a <b>swap</b> with another teacher (applies when they accept).
                </p>
            </div>

            {/* Terms you have taught in — past & current, derived from your courses */}
            {timeline.length > 0 && (
                <div className="mb-4">
                    <span className="text-xs text-slate-400">Your teaching terms:</span>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        {timeline.map((t) => (
                            <span key={`${t.batch}-${t.semester}`}
                                className={`text-xs rounded-full px-2.5 py-1 border ${
                                    t.is_current ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                                Batch {t.batch} · {t.semester}
                                {t.is_current ? " · current" : ""}
                                {" · "}{t.course_count} course{t.course_count !== 1 ? "s" : ""}
                                {!t.published && " · no routine"}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Batches you have classes in — quick orientation */}
            {slots.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs text-slate-400">Your batches:</span>
                    {[...new Set(slots.map((s) => s.batch))].sort((a, b) => b - a).map((b) => {
                        const n = slots.filter((s) => s.batch === b).length;
                        return (
                            <span key={b} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">
                                Batch {b} · {n} class{n !== 1 ? "es" : ""}
                            </span>
                        );
                    })}
                </div>
            )}

            {message.text && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {message.text}
                </div>
            )}

            {incoming.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h3 className="font-semibold text-slate-700">Swap proposals for you</h3>
                    {incoming.map((r) => (
                        <div key={r.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-slate-700">
                                <b>{r.requested_by_name}</b> wants to swap their{" "}
                                <b>{r.slot?.course_code}</b> ({r.slot?.day} {r.slot?.period_label}, Batch {r.slot?.batch})
                                with your <b>{r.target_slot?.course_code}</b> ({r.target_slot?.day} {r.target_slot?.period_label}).
                            </p>
                            {r.reason && <p className="text-xs text-slate-500 mt-1">Reason: {r.reason}</p>}
                            <div className="flex gap-2 mt-3">
                                <button onClick={() => decide(r, "accept")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                    <CheckCircle2 size={14} /> Accept swap
                                </button>
                                <button onClick={() => decide(r, "decline")}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border text-red-600 rounded-lg text-sm hover:bg-red-50">
                                    <XCircle size={14} /> Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto bg-white border rounded-xl mb-6">
                <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-800 text-white">
                        <tr>
                            <th className="px-3 py-2 text-left">Day</th>
                            {periods.map((p) => <th key={p.id} className="px-3 py-2">{p.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS.map((day) => (
                            <tr key={day} className="border-t align-top">
                                <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{day}</td>
                                {periods.map((p) => (
                                    <td key={p.id} className="px-2 py-2 border-l min-w-[130px]">
                                        {slotsAt(day, p.id).map((s) => (
                                            <div key={s.id} className="bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mb-1 text-left">
                                                <p className="font-semibold text-slate-800 flex items-center gap-1">
                                                    {s.course_code || s.course_title}
                                                    {s.you_teach && <span title="Your course" className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                                </p>
                                                {s.course_title && s.course_code && (
                                                    <p className="text-[11px] text-slate-600 truncate">{s.course_title}</p>
                                                )}
                                                <p className="text-[11px] text-slate-500">
                                                    <span className="font-medium text-amber-700">Batch {s.batch}</span> · {s.semester}
                                                    {s.group_label && ` · ${s.group_label}`}
                                                    {s.room && ` · R# ${s.room}`}
                                                </p>
                                                <div className="flex gap-2 pt-1">
                                                    <button onClick={() => openMove(s)} title="Move to a free slot (admin approves)"
                                                        className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 text-[11px]">
                                                        <MoveRight size={11} /> Move
                                                    </button>
                                                    <button onClick={() => openSwap(s)} title="Swap with another teacher"
                                                        className="text-purple-600 hover:text-purple-800 inline-flex items-center gap-0.5 text-[11px]">
                                                        <ArrowLeftRight size={11} /> Swap
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {slots.length === 0 && (
                    <p className="p-6 text-center text-sm text-slate-400">
                        No classes assigned to you in any published routine yet — ask admin to attach your
                        account to your routine slots.
                    </p>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-slate-700 mb-2">My requests</h3>
                <div className="space-y-2">
                    {outgoing.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
                    {outgoing.map((r) => (
                        <div key={r.id} className="bg-white border rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 text-sm">
                            {statusChip(r.status)}
                            <span className="text-slate-700">
                                {r.type === "swap"
                                    ? <>Swap <b>{r.slot?.course_code}</b> ⇄ <b>{r.target_slot?.course_code}</b> ({r.target_slot?.teacher_names?.join(", ")})</>
                                    : <>Move <b>{r.slot?.course_code}</b> → {r.proposed_day} {r.proposed_period_label}</>}
                            </span>
                            {r.status === "pending_teacher" && (
                                <span className="text-xs text-amber-600 inline-flex items-center gap-1"><RefreshCw size={11} /> waiting for the other teacher</span>
                            )}
                            {r.status === "pending_admin" && (
                                <span className="text-xs text-amber-600 inline-flex items-center gap-1"><RefreshCw size={11} /> waiting for admin</span>
                            )}
                            {r.status.startsWith("pending") && (
                                <button onClick={() => decide(r, "cancel")} className="ml-auto text-xs text-red-500 hover:text-red-700">Cancel</button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* move modal */}
            {moveModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-bold text-slate-800">
                                Move {moveModal.slot.course_code} (Batch {moveModal.slot.batch})
                            </h3>
                            <button onClick={() => setMoveModal(null)}><X size={20} /></button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            Green cells are free for the batch, you and the room. Pick one — admin gets the request.
                        </p>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-2 py-1 text-left">Day</th>
                                        {periods.map((p) => <th key={p.id} className="px-2 py-1">{p.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((day) => (
                                        <tr key={day} className="border-t">
                                            <td className="px-2 py-1 font-medium">{day}</td>
                                            {periods.map((p) => {
                                                const cell = moveModal.matrix?.[day]?.[p.id] ?? moveModal.matrix?.[day]?.[String(p.id)];
                                                const free = cell?.free;
                                                const chosen = moveModal.chosen?.day === day && moveModal.chosen?.period_id === p.id;
                                                return (
                                                    <td key={p.id} className="border-l p-1">
                                                        <button
                                                            disabled={!free}
                                                            title={free ? "Free" : (cell?.conflicts || []).join("\n")}
                                                            onClick={() => setMoveModal({ ...moveModal, chosen: { day, period_id: p.id } })}
                                                            className={`w-full py-2 rounded ${chosen ? "bg-indigo-600 text-white"
                                                                : free ? "bg-green-50 hover:bg-green-100 text-green-700"
                                                                : "bg-red-50 text-red-300 cursor-not-allowed"}`}>
                                                            {chosen ? "✓" : free ? "free" : "busy"}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            <label className="block text-sm">
                                <span className="text-slate-600">Room (optional change)</span>
                                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={moveModal.room}
                                    onChange={(e) => setMoveModal({ ...moveModal, room: e.target.value })} />
                            </label>
                            <label className="block text-sm">
                                <span className="text-slate-600">Reason (shown to admin)</span>
                                <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={moveModal.reason}
                                    onChange={(e) => setMoveModal({ ...moveModal, reason: e.target.value })} />
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setMoveModal(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm">Cancel</button>
                            <button onClick={sendMove} disabled={!moveModal.chosen}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50">
                                <Send size={14} /> Send to admin
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* swap modal */}
            {swapModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-lg font-bold text-slate-800">
                                Swap {swapModal.slot.course_code} ({swapModal.slot.day} {swapModal.slot.period_label})
                            </h3>
                            <button onClick={() => setSwapModal(null)}><X size={20} /></button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            The other teacher gets a notification and must accept — then both classes exchange
                            slots automatically (conflicts are re-checked at that moment).
                        </p>
                        <label className="block text-sm mb-3">
                            <span className="text-slate-600">Swap with</span>
                            <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={swapModal.targetTeacher}
                                onChange={(e) => pickSwapTeacher(Number(e.target.value))}>
                                <option value="">— choose teacher —</option>
                                {teachers.map((t) => <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>)}
                            </select>
                        </label>
                        {swapModal.targetTeacher && (
                            <label className="block text-sm mb-3">
                                <span className="text-slate-600">Their class</span>
                                <select className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={swapModal.targetSlotId}
                                    onChange={(e) => setSwapModal({ ...swapModal, targetSlotId: e.target.value })}>
                                    <option value="">— choose class —</option>
                                    {swapModal.targetSlots.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.course_code || s.course_title} · {s.day} {s.period_label} · Batch {s.batch}
                                        </option>
                                    ))}
                                </select>
                                {swapModal.targetSlots.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <AlertTriangle size={12} /> This teacher has no classes in a published routine.
                                    </p>
                                )}
                            </label>
                        )}
                        <label className="block text-sm">
                            <span className="text-slate-600">Message / reason</span>
                            <textarea rows={2} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" value={swapModal.reason}
                                onChange={(e) => setSwapModal({ ...swapModal, reason: e.target.value })}
                                placeholder="e.g. I have a conference on Wednesday — could we swap?" />
                        </label>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setSwapModal(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm">Cancel</button>
                            <button onClick={sendSwap} disabled={!swapModal.targetSlotId}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50">
                                <Send size={14} /> Propose swap
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeacherRoutine;
