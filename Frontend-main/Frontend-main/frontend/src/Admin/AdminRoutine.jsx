import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
    CalendarClock, Plus, Pencil, Trash2, X, Save, Printer, Eye,
    CheckCircle2, XCircle, AlertTriangle, RefreshCw,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

const inputCls =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

const emptySlot = {
    day: "Sunday", period_id: "", course_code: "", course_title: "",
    teacher_ids: [], teacher_initials: "", room: "", group_label: "",
};

function AdminRoutine() {
    const { user } = useContext(AuthContext);
    const adminId = user?.id;

    const [tab, setTab] = useState("editor"); // editor | requests | holidays | periods
    const [routines, setRoutines] = useState([]);
    const [routineId, setRoutineId] = useState(null);
    const [grid, setGrid] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [message, setMessage] = useState({ type: "", text: "" });

    // availability overlay
    const [heatTeacher, setHeatTeacher] = useState("");
    const [heatMatrix, setHeatMatrix] = useState(null);

    // modals
    const [routineModal, setRoutineModal] = useState(null); // {batch, semester, ...}
    const [slotModal, setSlotModal] = useState(null);       // {id?, day, period_id, ...}
    const [conflicts, setConflicts] = useState([]);
    const [force, setForce] = useState(false);

    const [requests, setRequests] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ title: "", kind: "holiday", start_date: "", end_date: "" });
    const [newPeriod, setNewPeriod] = useState({ label: "", start_time: "", end_time: "" });

    const flash = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    };

    const loadRoutines = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/v1/routine/list`);
            setRoutines(res.data);
            if (res.data.length && !routineId) setRoutineId(res.data[0].id);
        } catch {
            flash("error", "Could not load routines");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadGrid = useCallback(async () => {
        if (!routineId) return setGrid(null);
        try {
            const res = await axios.get(`${BACKEND_URL}/v1/routine/grid?routine_id=${routineId}`);
            setGrid(res.data);
        } catch {
            setGrid(null);
        }
    }, [routineId]);

    useEffect(() => {
        loadRoutines();
        axios.get(`${BACKEND_URL}/v1/routine/teachers`).then((r) => setTeachers(r.data)).catch(() => {});
        axios.get(`${BACKEND_URL}/v1/routine/periods`).then((r) => setPeriods(r.data)).catch(() => {});
    }, [loadRoutines]);

    useEffect(() => { loadGrid(); }, [loadGrid]);

    useEffect(() => {
        if (tab === "requests" && adminId) {
            axios.get(`${BACKEND_URL}/v1/routine/requests/admin?user_id=${adminId}`)
                .then((r) => setRequests(r.data)).catch(() => {});
        }
        if (tab === "holidays") {
            axios.get(`${BACKEND_URL}/v1/routine/holidays`)
                .then((r) => setHolidays(r.data)).catch(() => {});
        }
    }, [tab, adminId]);

    // availability heatmap
    useEffect(() => {
        if (!heatTeacher || !routineId) return setHeatMatrix(null);
        axios.get(`${BACKEND_URL}/v1/routine/availability?routine_id=${routineId}&teacher_ids=${heatTeacher}`)
            .then((r) => setHeatMatrix(r.data.matrix))
            .catch(() => setHeatMatrix(null));
    }, [heatTeacher, routineId, grid]);

    const routine = grid?.routine;
    const slotsAt = (day, periodId) =>
        (grid?.slots || []).filter((s) => s.day === day && s.period_id === periodId);

    // ---------- routine CRUD ----------
    const saveRoutine = async () => {
        try {
            const payload = {
                ...routineModal,
                batch: Number(routineModal.batch),
                copy_from_routine_id: routineModal.copy_from_routine_id
                    ? Number(routineModal.copy_from_routine_id) : null,
            };
            if (routineModal.id) {
                await axios.put(`${BACKEND_URL}/v1/routine/admin/routines/${routineModal.id}?user_id=${adminId}`, payload);
            } else {
                const res = await axios.post(`${BACKEND_URL}/v1/routine/admin/routines?user_id=${adminId}`, payload);
                setRoutineId(res.data.id);
            }
            setRoutineModal(null);
            flash("success", "Routine saved");
            loadRoutines();
            loadGrid();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Save failed");
        }
    };

    const togglePublish = async () => {
        try {
            await axios.put(`${BACKEND_URL}/v1/routine/admin/routines/${routineId}?user_id=${adminId}`,
                { published: !routine.published });
            flash("success", routine.published ? "Unpublished" : "Published — batch students notified");
            loadRoutines();
            loadGrid();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Failed");
        }
    };

    const deleteRoutine = async () => {
        if (!window.confirm(`Delete this routine and all its ${grid?.slots?.length ?? 0} classes?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/v1/routine/admin/routines/${routineId}?user_id=${adminId}`);
            setRoutineId(null);
            flash("success", "Routine deleted");
            loadRoutines();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Failed");
        }
    };

    // ---------- slot CRUD ----------
    const openSlotModal = (slot, day, periodId) => {
        setConflicts([]);
        setForce(false);
        if (slot) {
            setSlotModal({ ...slot, group_label: slot.group_label || "", teacher_ids: slot.teacher_ids || [] });
        } else {
            setSlotModal({ ...emptySlot, day, period_id: periodId });
        }
    };

    const autoInitials = (ids) =>
        ids.map((id) => teachers.find((t) => t.teacher_id === id)?.initials || "?").join("+");

    const saveSlot = async () => {
        const payload = {
            routine_id: routineId,
            day: slotModal.day,
            period_id: Number(slotModal.period_id),
            course_code: slotModal.course_code || null,
            course_title: slotModal.course_title || null,
            teacher_ids: slotModal.teacher_ids,
            teacher_initials: slotModal.teacher_initials || null,
            room: slotModal.room || null,
            group_label: slotModal.group_label || null,
            force,
        };
        try {
            if (slotModal.id) {
                await axios.put(`${BACKEND_URL}/v1/routine/admin/slots/${slotModal.id}?user_id=${adminId}`, payload);
            } else {
                await axios.post(`${BACKEND_URL}/v1/routine/admin/slots?user_id=${adminId}`, payload);
            }
            setSlotModal(null);
            flash("success", "Class saved");
            loadGrid();
        } catch (e) {
            const detail = e.response?.data?.detail;
            if (e.response?.status === 409 && detail?.conflicts) {
                setConflicts(detail.conflicts);
            } else {
                flash("error", typeof detail === "string" ? detail : "Save failed");
            }
        }
    };

    const deleteSlot = async (slot) => {
        if (!window.confirm(`Remove ${slot.course_code || "this class"} from ${slot.day}?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/v1/routine/admin/slots/${slot.id}?user_id=${adminId}`);
            flash("success", "Class removed");
            loadGrid();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Failed");
        }
    };

    // ---------- requests ----------
    const decideRequest = async (req, action) => {
        try {
            await axios.put(`${BACKEND_URL}/v1/routine/requests/${req.id}/${action}?user_id=${adminId}`);
            flash("success", `Request ${action === "accept" ? "approved — routine updated & everyone notified" : "declined"}`);
            const r = await axios.get(`${BACKEND_URL}/v1/routine/requests/admin?user_id=${adminId}`);
            setRequests(r.data);
            loadGrid();
        } catch (e) {
            const detail = e.response?.data?.detail;
            flash("error", detail?.conflicts ? `Cannot apply — ${detail.conflicts.join("; ")}` : (detail || "Failed"));
        }
    };

    // ---------- holidays / periods ----------
    const addHoliday = async () => {
        if (!newHoliday.title || !newHoliday.start_date) return flash("error", "Title and start date required");
        try {
            await axios.post(`${BACKEND_URL}/v1/routine/admin/holidays?user_id=${adminId}`, {
                ...newHoliday, end_date: newHoliday.end_date || newHoliday.start_date,
            });
            setNewHoliday({ title: "", kind: "holiday", start_date: "", end_date: "" });
            const r = await axios.get(`${BACKEND_URL}/v1/routine/holidays`);
            setHolidays(r.data);
            flash("success", "Added to academic calendar");
        } catch (e) {
            flash("error", e.response?.data?.detail || "Failed");
        }
    };

    const deleteHoliday = async (h) => {
        if (!window.confirm(`Remove "${h.title}"?`)) return;
        await axios.delete(`${BACKEND_URL}/v1/routine/admin/holidays/${h.id}?user_id=${adminId}`).catch(() => {});
        setHolidays((prev) => prev.filter((x) => x.id !== h.id));
    };

    const addPeriod = async () => {
        if (!newPeriod.label || !newPeriod.start_time || !newPeriod.end_time)
            return flash("error", "Label, start and end required (e.g. 08:30)");
        try {
            await axios.post(`${BACKEND_URL}/v1/routine/admin/periods?user_id=${adminId}`, {
                ...newPeriod, display_order: periods.length,
            });
            setNewPeriod({ label: "", start_time: "", end_time: "" });
            const r = await axios.get(`${BACKEND_URL}/v1/routine/periods`);
            setPeriods(r.data);
            loadGrid();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Failed");
        }
    };

    const deletePeriod = async (p) => {
        try {
            await axios.delete(`${BACKEND_URL}/v1/routine/admin/periods/${p.id}?user_id=${adminId}`);
            setPeriods((prev) => prev.filter((x) => x.id !== p.id));
            loadGrid();
        } catch (e) {
            flash("error", e.response?.data?.detail || "Period in use");
        }
    };

    // ---------- print ----------
    const printRoutine = () => {
        if (!grid) return;
        const head = grid.periods.map((p) => `<th>${p.label}</th>`).join("");
        const rows = DAYS.map((day) => {
            const cells = grid.periods.map((p) => {
                const items = slotsAt(day, p.id).map((s) =>
                    `<div><b>${s.course_code || s.course_title || ""}</b>` +
                    `${s.teacher_initials ? ` [${s.teacher_initials}]` : ""}` +
                    `${s.group_label ? ` [${s.group_label}]` : ""}` +
                    `${s.room ? ` [R# ${s.room}]` : ""}</div>`
                ).join("");
                return `<td>${items}</td>`;
            }).join("");
            return `<tr><td><b>${day}</b></td>${cells}</tr>`;
        }).join("");
        const w = window.open("", "_blank");
        w.document.write(`<html><head><title>${routine.title || "Class Routine"}</title>
<style>body{font-family:Arial;padding:24px} h2,h3,p{text-align:center;margin:4px}
table{border-collapse:collapse;width:100%;margin-top:16px} td,th{border:1px solid #333;padding:6px;font-size:12px;text-align:center}</style></head><body>
<h2>Department of Computer Science and Engineering</h2><h3>University of Dhaka</h3>
<p><b>${routine.title || `Batch ${routine.batch} — ${routine.semester}`}</b> · Regular Class Routine</p>
<p>${routine.class_start_date ? `Class Start: ${routine.class_start_date}` : ""} ${routine.room_note ? ` · ${routine.room_note}` : ""}</p>
<table><tr><th>Day</th>${head}</tr>${rows}</table>
<script>window.print()</script></body></html>`);
        w.document.close();
    };

    const toggleTeacherInModal = (tid) => {
        const has = slotModal.teacher_ids.includes(tid);
        const ids = has ? slotModal.teacher_ids.filter((x) => x !== tid) : [...slotModal.teacher_ids, tid];
        setSlotModal({ ...slotModal, teacher_ids: ids, teacher_initials: autoInitials(ids) });
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <CalendarClock className="text-indigo-600" /> Routine Management
                </h2>
                <p className="text-slate-500 text-sm">
                    Build batch-wise class routines, see free slots, approve reschedule requests. Conflicts
                    (batch / teacher / room double-booking) are blocked automatically.
                </p>
            </div>

            {message.text && (
                <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {[["editor", "Routine Editor"], ["requests", "Change Requests"], ["holidays", "Academic Calendar"], ["periods", "Time Periods"]].map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === id ? "bg-indigo-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === "editor" && (
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <select value={routineId || ""} onChange={(e) => setRoutineId(Number(e.target.value))}
                            className={`${inputCls} max-w-xs`}>
                            {routines.map((r) => (
                                <option key={r.id} value={r.id}>
                                    Batch {r.batch} · {r.semester} {r.published ? "✓ published" : "(draft)"} · {r.slot_count} classes
                                </option>
                            ))}
                        </select>
                        <button onClick={() => setRoutineModal({ batch: "", semester: "", title: "", room_note: "", class_start_date: "", copy_from_routine_id: "" })}
                            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                            <Plus size={16} /> New Routine
                        </button>
                        {routine && (
                            <>
                                <button onClick={() => setRoutineModal({ ...routine, copy_from_routine_id: "" })}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                                    <Pencil size={14} /> Edit
                                </button>
                                <button onClick={togglePublish}
                                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${routine.published ? "bg-amber-100 text-amber-800" : "bg-green-600 text-white hover:bg-green-700"}`}>
                                    <Eye size={14} /> {routine.published ? "Unpublish" : "Publish"}
                                </button>
                                <button onClick={printRoutine}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-white border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                                    <Printer size={14} /> Print
                                </button>
                                <button onClick={deleteRoutine}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
                                    <Trash2 size={14} /> Delete
                                </button>
                            </>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-slate-500">Free-slot view for:</span>
                            <select value={heatTeacher} onChange={(e) => setHeatTeacher(e.target.value)} className={`${inputCls} max-w-[180px]`}>
                                <option value="">— off —</option>
                                {teachers.map((t) => (
                                    <option key={t.teacher_id} value={t.teacher_id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!routine ? (
                        <div className="bg-white border rounded-xl p-12 text-center text-slate-400">
                            No routine yet — create one with “New Routine”.
                        </div>
                    ) : (
                        <div className="overflow-x-auto bg-white border rounded-xl">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Day</th>
                                        {grid.periods.map((p) => (
                                            <th key={p.id} className="px-3 py-2">{p.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map((day) => (
                                        <tr key={day} className="border-t align-top">
                                            <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{day}</td>
                                            {grid.periods.map((p) => {
                                                const cell = heatMatrix?.[day]?.[p.id] ?? heatMatrix?.[day]?.[String(p.id)];
                                                return (
                                                    <td key={p.id}
                                                        className={`px-2 py-2 border-l min-w-[130px] ${heatMatrix ? (cell?.free ? "bg-green-50" : "bg-red-50") : ""}`}
                                                        title={cell && !cell.free ? cell.conflicts.join("\n") : ""}>
                                                        <div className="space-y-1">
                                                            {slotsAt(day, p.id).map((s) => (
                                                                <div key={s.id} className="group bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 text-left">
                                                                    <p className="font-semibold text-indigo-900">{s.course_code || s.course_title}</p>
                                                                    <p className="text-[11px] text-slate-600">
                                                                        {s.teacher_initials && `[${s.teacher_initials}] `}
                                                                        {s.group_label && `[${s.group_label}] `}
                                                                        {s.room && `R# ${s.room}`}
                                                                    </p>
                                                                    <div className="hidden group-hover:flex gap-2 pt-1">
                                                                        <button onClick={() => openSlotModal(s)} className="text-indigo-600"><Pencil size={12} /></button>
                                                                        <button onClick={() => deleteSlot(s)} className="text-red-500"><Trash2 size={12} /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button onClick={() => openSlotModal(null, day, p.id)}
                                                                className="w-full text-slate-300 hover:text-indigo-500 text-xs py-0.5">＋</button>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "requests" && (
                <div className="space-y-3">
                    {requests.length === 0 && (
                        <div className="bg-white border rounded-xl p-8 text-center text-slate-400">No change requests yet.</div>
                    )}
                    {requests.map((r) => (
                        <div key={r.id} className="bg-white border rounded-xl p-4">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    r.status === "applied" ? "bg-green-100 text-green-700"
                                    : r.status.startsWith("pending") ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-500"}`}>
                                    {r.status}
                                </span>
                                <span className="font-medium text-slate-800">{r.requested_by_name}</span>
                                <span className="text-slate-500">
                                    {r.type === "swap" ? "proposes a swap" : "requests a move"}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                                <b>{r.slot?.course_code}</b> (Batch {r.slot?.batch}, {r.slot?.semester}) — {r.slot?.day} {r.slot?.period_label}
                                {r.type === "swap" && r.target_slot && (
                                    <> ⇄ <b>{r.target_slot.course_code}</b> — {r.target_slot.day} {r.target_slot.period_label} ({r.target_slot.teacher_names?.join(", ")})</>
                                )}
                                {r.type === "move" && (
                                    <> → {r.proposed_day} {r.proposed_period_label}{r.proposed_room ? `, R# ${r.proposed_room}` : ""}</>
                                )}
                            </p>
                            {r.reason && <p className="text-xs text-slate-400 mt-1">Reason: {r.reason}</p>}
                            {r.status === "pending_admin" && (
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => decideRequest(r, "accept")}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                        <CheckCircle2 size={14} /> Approve
                                    </button>
                                    <button onClick={() => decideRequest(r, "decline")}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
                                        <XCircle size={14} /> Decline
                                    </button>
                                </div>
                            )}
                            {r.status === "pending_teacher" && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <RefreshCw size={12} /> Waiting for the other teacher to accept
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === "holidays" && (
                <div className="space-y-4 max-w-3xl">
                    <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-5 gap-3 items-end">
                        <Field label="Title"><input className={inputCls} value={newHoliday.title}
                            onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })} placeholder="Eid Ul Fitr" /></Field>
                        <Field label="Type">
                            <select className={inputCls} value={newHoliday.kind}
                                onChange={(e) => setNewHoliday({ ...newHoliday, kind: e.target.value })}>
                                <option value="holiday">Holiday</option>
                                <option value="vacation">Vacation</option>
                                <option value="exam">Exam</option>
                                <option value="pl">Preparatory Leave</option>
                                <option value="incourse">In-course</option>
                            </select>
                        </Field>
                        <Field label="From"><input type="date" className={inputCls} value={newHoliday.start_date}
                            onChange={(e) => setNewHoliday({ ...newHoliday, start_date: e.target.value })} /></Field>
                        <Field label="To (optional)"><input type="date" className={inputCls} value={newHoliday.end_date}
                            onChange={(e) => setNewHoliday({ ...newHoliday, end_date: e.target.value })} /></Field>
                        <button onClick={addHoliday}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm h-fit">Add</button>
                    </div>
                    <p className="text-xs text-slate-500">
                        On these dates the daily “today’s classes” notification is paused and routine pages show the notice.
                    </p>
                    <div className="bg-white border rounded-xl divide-y">
                        {holidays.map((h) => (
                            <div key={h.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                                <span className="flex-1 text-slate-800">{h.title}</span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">{h.kind}</span>
                                <span className="text-slate-500 text-xs">
                                    {h.start_date}{h.end_date !== h.start_date ? ` → ${h.end_date}` : ""}
                                </span>
                                <button onClick={() => deleteHoliday(h)} className="text-red-500"><Trash2 size={15} /></button>
                            </div>
                        ))}
                        {holidays.length === 0 && <p className="p-4 text-sm text-slate-400">Nothing yet.</p>}
                    </div>
                </div>
            )}

            {tab === "periods" && (
                <div className="space-y-4 max-w-2xl">
                    <div className="bg-white border rounded-xl p-4 grid sm:grid-cols-4 gap-3 items-end">
                        <Field label='Label'><input className={inputCls} value={newPeriod.label} placeholder="8:30-10:00 AM"
                            onChange={(e) => setNewPeriod({ ...newPeriod, label: e.target.value })} /></Field>
                        <Field label="Start (24h)"><input className={inputCls} value={newPeriod.start_time} placeholder="08:30"
                            onChange={(e) => setNewPeriod({ ...newPeriod, start_time: e.target.value })} /></Field>
                        <Field label="End (24h)"><input className={inputCls} value={newPeriod.end_time} placeholder="10:00"
                            onChange={(e) => setNewPeriod({ ...newPeriod, end_time: e.target.value })} /></Field>
                        <button onClick={addPeriod}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm h-fit">Add</button>
                    </div>
                    <div className="bg-white border rounded-xl divide-y">
                        {periods.map((p) => (
                            <div key={p.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                                <span className="flex-1 text-slate-800">{p.label}</span>
                                <span className="text-slate-500 text-xs">{p.start_time}–{p.end_time}</span>
                                <button onClick={() => deletePeriod(p)} className="text-red-500" title="Only deletable when unused">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* routine modal */}
            {routineModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{routineModal.id ? "Edit Routine" : "New Routine"}</h3>
                            <button onClick={() => setRoutineModal(null)}><X size={20} /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Batch *"><input type="number" className={inputCls} value={routineModal.batch}
                                onChange={(e) => setRoutineModal({ ...routineModal, batch: e.target.value })} placeholder="27" /></Field>
                            <Field label='Semester * (e.g. "4-1")'><input className={inputCls} value={routineModal.semester}
                                onChange={(e) => setRoutineModal({ ...routineModal, semester: e.target.value })} /></Field>
                        </div>
                        <div className="mt-4 space-y-4">
                            <Field label="Title"><input className={inputCls} value={routineModal.title || ""}
                                onChange={(e) => setRoutineModal({ ...routineModal, title: e.target.value })}
                                placeholder="4th Year 1st Semester B.Sc 2024-2025" /></Field>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Room note"><input className={inputCls} value={routineModal.room_note || ""}
                                    onChange={(e) => setRoutineModal({ ...routineModal, room_note: e.target.value })}
                                    placeholder="Room No.: 429" /></Field>
                                <Field label="Class start date"><input className={inputCls} value={routineModal.class_start_date || ""}
                                    onChange={(e) => setRoutineModal({ ...routineModal, class_start_date: e.target.value })}
                                    placeholder="22.02.2026" /></Field>
                            </div>
                            {!routineModal.id && (
                                <Field label="Copy classes from (optional)">
                                    <select className={inputCls} value={routineModal.copy_from_routine_id}
                                        onChange={(e) => setRoutineModal({ ...routineModal, copy_from_routine_id: e.target.value })}>
                                        <option value="">— start empty —</option>
                                        {routines.map((r) => (
                                            <option key={r.id} value={r.id}>Batch {r.batch} · {r.semester}</option>
                                        ))}
                                    </select>
                                </Field>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setRoutineModal(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm">Cancel</button>
                            <button onClick={saveRoutine} disabled={!routineModal.batch || !routineModal.semester}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50">
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* slot modal */}
            {slotModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">{slotModal.id ? "Edit Class" : "Add Class"}</h3>
                            <button onClick={() => setSlotModal(null)}><X size={20} /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Day">
                                <select className={inputCls} value={slotModal.day}
                                    onChange={(e) => setSlotModal({ ...slotModal, day: e.target.value })}>
                                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                                </select>
                            </Field>
                            <Field label="Period">
                                <select className={inputCls} value={slotModal.period_id}
                                    onChange={(e) => setSlotModal({ ...slotModal, period_id: e.target.value })}>
                                    {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                                </select>
                            </Field>
                            <Field label='Course code'><input className={inputCls} value={slotModal.course_code || ""}
                                onChange={(e) => setSlotModal({ ...slotModal, course_code: e.target.value })} placeholder="CSE-4101" /></Field>
                            <Field label="Course title"><input className={inputCls} value={slotModal.course_title || ""}
                                onChange={(e) => setSlotModal({ ...slotModal, course_title: e.target.value })} placeholder="Artificial Intelligence" /></Field>
                            <Field label="Room"><input className={inputCls} value={slotModal.room || ""}
                                onChange={(e) => setSlotModal({ ...slotModal, room: e.target.value })} placeholder="429" /></Field>
                            <Field label="Group (optional)">
                                <select className={inputCls} value={slotModal.group_label}
                                    onChange={(e) => setSlotModal({ ...slotModal, group_label: e.target.value })}>
                                    <option value="">Whole batch</option>
                                    <option value="GA">GA</option>
                                    <option value="GB">GB</option>
                                </select>
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label={`Teachers (${slotModal.teacher_ids.length} selected)`}>
                                <div className="max-h-36 overflow-y-auto border rounded-lg divide-y">
                                    {teachers.map((t) => (
                                        <label key={t.teacher_id} className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50">
                                            <input type="checkbox" checked={slotModal.teacher_ids.includes(t.teacher_id)}
                                                onChange={() => toggleTeacherInModal(t.teacher_id)} />
                                            <span className="flex-1">{t.name}</span>
                                            <span className="text-xs text-slate-400">{t.initials}</span>
                                        </label>
                                    ))}
                                    {teachers.length === 0 && <p className="p-3 text-xs text-slate-400">No teacher accounts yet — initials below still display on the routine.</p>}
                                </div>
                            </Field>
                            <div className="mt-3">
                                <Field label="Displayed initials"><input className={inputCls} value={slotModal.teacher_initials || ""}
                                    onChange={(e) => setSlotModal({ ...slotModal, teacher_initials: e.target.value })} placeholder="MMK+PR" /></Field>
                            </div>
                        </div>
                        {conflicts.length > 0 && (
                            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-red-700 flex items-center gap-1">
                                    <AlertTriangle size={14} /> Conflicts detected:
                                </p>
                                <ul className="text-xs text-red-600 list-disc pl-5 mt-1">
                                    {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                                <label className="flex items-center gap-2 text-xs text-red-700 mt-2">
                                    <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
                                    I understand — save anyway (admin override)
                                </label>
                            </div>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setSlotModal(null)} className="px-4 py-2 rounded-lg bg-slate-100 text-sm">Cancel</button>
                            <button onClick={saveSlot} disabled={!slotModal.period_id && periods.length === 0}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">
                                <Save size={16} /> {conflicts.length > 0 && force ? "Force save" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminRoutine;
