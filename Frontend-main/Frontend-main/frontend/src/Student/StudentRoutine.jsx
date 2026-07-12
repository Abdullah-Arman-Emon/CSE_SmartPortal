import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { CalendarClock, Printer, Sun, BookOpen, DoorClosed } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import BatchChangeCard from "./BatchChangeCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

// Read-only weekly routine for the student's own batch + semester.
function StudentRoutine() {
    const { user } = useContext(AuthContext);
    const [timeline, setTimeline] = useState(null); // {batch, current_semester, terms:[...]}
    const [selected, setSelected] = useState(null); // the chosen term object
    const [grid, setGrid] = useState(null);
    const [today, setToday] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Derived timeline: every semester the batch has reached, past → current.
    useEffect(() => {
        if (!user?.id) return;
        axios.get(`${BACKEND_URL}/v1/routine/student/timeline?user_id=${user.id}`)
            .then((res) => {
                setTimeline(res.data);
                const terms = res.data.terms || [];
                const current = terms.find((t) => t.is_current) || terms[terms.length - 1];
                setSelected(current || null);
                if (!current) { setError("No semester on record yet."); setLoading(false); }
            })
            .catch((e) => {
                const st = e.response?.status;
                const detail = e.response?.data?.detail || "";
                const noProfile = st === 404 && /student profile/i.test(detail);
                setError(noProfile
                    ? "No student profile is linked to your account yet — ask admin to set your batch and semester."
                    : st === 404
                        ? "Routine service unavailable — the backend may be out of date (restart it). If this persists, contact admin."
                        : `Could not load your routine timeline${st ? ` (error ${st})` : " (backend unreachable — is it running?)"}.`);
                setLoading(false);
            });
    }, [user]);

    useEffect(() => {
        if (!selected) return;
        setLoading(true);
        const reqs = [
            axios.get(`${BACKEND_URL}/v1/routine/grid?batch=${selected.batch}&semester=${encodeURIComponent(selected.semester)}`),
        ];
        if (selected.is_current) {
            reqs.push(axios.get(`${BACKEND_URL}/v1/routine/today?batch=${selected.batch}&semester=${encodeURIComponent(selected.semester)}`));
        }
        Promise.all(reqs)
            .then(([g, t]) => {
                setGrid(g.data);
                setToday(t ? t.data : null);
                setError(null);
            })
            .catch((e) => {
                setGrid(null);
                setToday(null);
                setError(e.response?.status === 404
                    ? `No routine published yet for Batch ${selected.batch} (${selected.semester}).`
                    : "Could not load the routine.");
            })
            .finally(() => setLoading(false));
    }, [selected]);

    const profile = timeline ? { batch: timeline.batch, current_semester: selected?.semester } : null;

    const slotsAt = (day, periodId) =>
        (grid?.slots || []).filter((s) => s.day === day && s.period_id === periodId);

    const todayName = today?.day;

    // Course legend + teacher-initials key, derived from the routine's own slots —
    // this is the "what does CSE-4113 / [MFA] mean" table every real DU routine
    // prints under the grid.
    const buildLegend = () => {
        const courses = new Map();      // code -> {code, title, teachers:Map(name->initial), rooms:Set, groups:Set}
        const initials = new Map();     // initial -> Set(teacher names)
        for (const s of grid?.slots || []) {
            const key = s.course_code || s.course_title;
            if (!key) continue;
            if (!courses.has(key))
                courses.set(key, { code: s.course_code, title: s.course_title, teachers: new Map(), rooms: new Set(), groups: new Set() });
            const c = courses.get(key);
            (s.teacher_names || []).forEach((n) => c.teachers.set(n, true));
            if (s.room) c.rooms.add(s.room);
            if (s.group_label) c.groups.add(s.group_label);
            // teacher key: split combined "MFA+MoR" initials against the names
            const inis = (s.teacher_initials || "").split("+").map((x) => x.trim()).filter(Boolean);
            const names = s.teacher_names || [];
            inis.forEach((ini, i) => {
                if (!initials.has(ini)) initials.set(ini, new Set());
                if (names[i]) initials.get(ini).add(names[i]);
            });
        }
        const courseList = [...courses.values()].sort((a, b) => (a.code || "").localeCompare(b.code || ""));
        const initialList = [...initials.entries()]
            .map(([ini, names]) => ({ ini, names: [...names] }))
            .sort((a, b) => a.ini.localeCompare(b.ini));
        return { courseList, initialList };
    };
    const { courseList, initialList } = grid ? buildLegend() : { courseList: [], initialList: [] };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarClock className="text-blue-600" /> Class Routine
                    </h1>
                    {profile && (
                        <p className="text-slate-500 text-sm">
                            Batch {profile.batch} · Semester {profile.current_semester}
                            {grid?.routine?.title ? ` · ${grid.routine.title}` : ""}
                        </p>
                    )}
                </div>
                {grid && (
                    <button onClick={() => window.print()}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-white border rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                        <Printer size={14} /> Print
                    </button>
                )}
            </div>

            {timeline?.terms?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs text-slate-400 mr-1">Semesters:</span>
                    {timeline.terms.map((t) => {
                        const isSel = selected?.semester === t.semester;
                        return (
                            <button key={t.semester} onClick={() => setSelected(t)}
                                className={`text-xs rounded-full px-3 py-1 border transition ${
                                    isSel ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                                {t.semester}
                                {t.is_current && <span className="ml-1 opacity-80">· now</span>}
                                {!t.published && <span className="ml-1 opacity-60">·—</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {selected && !selected.is_current && (
                <div className="mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    Viewing a past semester's routine (Batch {selected.batch} · {selected.semester}) — read-only history.
                </div>
            )}

            {today?.holiday && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
                    <Sun size={16} /> Today is off — {today.holiday.title}
                    {today.holiday.kind !== "holiday" ? ` (${today.holiday.kind})` : ""}. No classes.
                </div>
            )}

            {loading && <div className="bg-white border rounded-xl p-12 text-center text-slate-400">Loading routine…</div>}
            {!loading && error && <div className="bg-white border rounded-xl p-12 text-center text-slate-500">{error}</div>}

            {grid && (
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
                                <tr key={day} className={`border-t align-top ${day === todayName ? "bg-blue-50/60" : ""}`}>
                                    <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">
                                        {day}
                                        {day === todayName && (
                                            <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">TODAY</span>
                                        )}
                                    </td>
                                    {grid.periods.map((p) => (
                                        <td key={p.id} className="px-2 py-2 border-l min-w-[120px]">
                                            {slotsAt(day, p.id).map((s) => (
                                                <div key={s.id} className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 mb-1 text-left">
                                                    <p className="font-semibold text-blue-900">{s.course_code || s.course_title}</p>
                                                    <p className="text-[11px] text-slate-600">
                                                        {s.teacher_initials && `[${s.teacher_initials}] `}
                                                        {s.group_label && `[${s.group_label}] `}
                                                        {s.room && `R# ${s.room}`}
                                                    </p>
                                                </div>
                                            ))}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {grid.routine?.room_note && (
                        <p className="px-4 py-2 text-xs text-slate-500 border-t">{grid.routine.room_note}
                            {grid.routine.class_start_date ? ` · Class start: ${grid.routine.class_start_date}` : ""}</p>
                    )}
                </div>
            )}

            {/* Course legend — what each code / teacher initial in the grid means */}
            {grid && courseList.length > 0 && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50">
                            <BookOpen size={16} className="text-blue-600" />
                            <h3 className="text-sm font-semibold text-slate-700">Courses this semester</h3>
                            <span className="text-xs text-slate-400">({courseList.length})</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="text-slate-500">
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left font-medium">Code</th>
                                        <th className="px-4 py-2 text-left font-medium">Course Title</th>
                                        <th className="px-4 py-2 text-left font-medium">Teacher(s)</th>
                                        <th className="px-4 py-2 text-left font-medium">Room</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseList.map((c) => (
                                        <tr key={c.code || c.title} className="border-b last:border-0 align-top">
                                            <td className="px-4 py-2 font-semibold text-blue-900 whitespace-nowrap">{c.code || "—"}</td>
                                            <td className="px-4 py-2 text-slate-700">{c.title || "—"}</td>
                                            <td className="px-4 py-2 text-slate-600">
                                                {[...c.teachers.keys()].join(", ") || "—"}
                                                {c.groups.size > 0 && (
                                                    <span className="ml-1 text-[11px] text-slate-400">· Group {[...c.groups].join(", ")}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{[...c.rooms].join(", ") || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {initialList.length > 0 && (
                        <div className="bg-white border rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b bg-slate-50">
                                <DoorClosed size={16} className="text-blue-600" />
                                <h3 className="text-sm font-semibold text-slate-700">Teacher initials</h3>
                            </div>
                            <div className="p-3 flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                                {initialList.map((t) => (
                                    <div key={t.ini} className="flex items-start gap-2 text-xs">
                                        <span className="shrink-0 font-mono font-semibold text-blue-800 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                                            {t.ini}
                                        </span>
                                        <span className="text-slate-600 pt-0.5">{t.names.join(", ")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <BatchChangeCard />
        </div>
    );
}

export default StudentRoutine;
