import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { CalendarClock, Printer, Sun } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

// Read-only weekly routine for the student's own batch + semester.
function StudentRoutine() {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [grid, setGrid] = useState(null);
    const [today, setToday] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        axios.get(`${BACKEND_URL}/v1/auth/get/student?user_id=${user.id}`)
            .then((res) => setProfile(res.data))
            .catch(() => {
                setError("Could not load your profile.");
                setLoading(false);
            });
    }, [user]);

    useEffect(() => {
        if (!profile?.batch || !profile?.current_semester) return;
        Promise.all([
            axios.get(`${BACKEND_URL}/v1/routine/grid?batch=${profile.batch}&semester=${profile.current_semester}`),
            axios.get(`${BACKEND_URL}/v1/routine/today?batch=${profile.batch}&semester=${profile.current_semester}`),
        ])
            .then(([g, t]) => {
                setGrid(g.data);
                setToday(t.data);
                setError(null);
            })
            .catch((e) => {
                setError(e.response?.status === 404
                    ? `No routine published yet for Batch ${profile.batch} (${profile.current_semester}).`
                    : "Could not load the routine.");
            })
            .finally(() => setLoading(false));
    }, [profile]);

    const slotsAt = (day, periodId) =>
        (grid?.slots || []).filter((s) => s.day === day && s.period_id === periodId);

    const todayName = today?.day;

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
        </div>
    );
}

export default StudentRoutine;
