import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import {
    TrendingUp, ChevronDown, ChevronRight, CheckCircle2, Clock, XCircle,
    AlertTriangle, User, CalendarDays, Filter, X,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const STATUS_META = {
    present: { char: "P", cls: "bg-green-100 text-green-700", dot: "bg-green-500", label: "Present" },
    late: { char: "L", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500", label: "Late" },
    absent: { char: "A", cls: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Absent" },
};

function pctColor(p) {
    if (p >= 75) return "text-green-600";
    if (p >= 60) return "text-amber-600";
    return "text-red-600";
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

// "2025-01-15" -> {day:"15", month:"Jan", year:"2025", monthKey:"2025-01", monthLabel:"January 2025"}
function parseDate(iso) {
    const [y, m, d] = (iso || "").split("-");
    const mi = parseInt(m, 10) - 1;
    return {
        day: d, year: y,
        month: MONTHS[mi]?.slice(0, 3) || m,
        monthKey: `${y}-${m}`,
        monthLabel: `${MONTHS[mi] || m} ${y}`,
    };
}

// Classes the student must attend (consecutively, from now) to reach 75%.
// (attended + n) / (total + n) >= 0.75  ->  n >= 3*total - 4*attended
function classesToEligible(attended, total) {
    const n = 3 * total - 4 * attended;
    return n > 0 ? Math.ceil(n) : 0;
}

function Ring({ percentage, size = 56 }) {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (Math.min(percentage, 100) / 100) * c;
    const stroke = percentage >= 75 ? "#16a34a" : percentage >= 60 ? "#d97706" : "#dc2626";
    return (
        <svg width={size} height={size} className="shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth="6"
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
                className="fill-slate-700 font-bold" fontSize="13">{percentage}%</text>
        </svg>
    );
}

function CourseCard({ course, statusFilter }) {
    const [open, setOpen] = useState(false);
    const sessions = useMemo(
        () => (statusFilter === "all"
            ? course.sessions
            : course.sessions.filter((s) => s.status === statusFilter)),
        [course.sessions, statusFilter]
    );

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition"
            >
                {open ? <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    : <ChevronRight size={18} className="text-slate-400 shrink-0" />}
                <Ring percentage={course.percentage} />
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800">{course.course_code}</span>
                        <span className="text-slate-500 text-sm truncate">— {course.title}</span>
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {course.type}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{course.attended}/{course.total_sessions} attended</span>
                        <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 size={12} />{course.present}</span>
                        <span className="inline-flex items-center gap-1 text-amber-600"><Clock size={12} />{course.late}</span>
                        <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={12} />{course.absent}</span>
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    {course.eligible ? (
                        <span className="text-xs text-green-600 font-medium">Exam eligible</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle size={12} /> Not eligible
                        </span>
                    )}
                </div>
            </button>

            {open && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/60">
                    {/* Eligibility insight — real, actionable value */}
                    <div className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
                        course.eligible ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-red-50 text-red-700 border border-red-100"}`}>
                        {course.eligible ? (
                            (() => {
                                // how many consecutive absences until you'd drop below 75%
                                const a = course.attended, t = course.total_sessions;
                                let miss = 0;
                                while ((a) / (t + miss + 1) >= 0.75) miss++;
                                return miss > 0
                                    ? `On track — you can miss up to ${miss} more class${miss > 1 ? "es" : ""} and stay exam-eligible.`
                                    : "On track — but missing even one more class puts eligibility at risk.";
                            })()
                        ) : (
                            (() => {
                                const need = classesToEligible(course.attended, course.total_sessions);
                                return `Below 75% — attend the next ${need} class${need > 1 ? "es" : ""} in a row to regain exam eligibility.`;
                            })()
                        )}
                    </div>

                    {/* Per-teacher breakdown */}
                    {course.teachers?.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                                <User size={12} /> Classes taken by teacher
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {course.teachers.map((t) => (
                                    <span key={t.teacher_id ?? "none"}
                                        className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600">
                                        {t.name} <span className="font-semibold text-slate-800">· {t.sessions_taken}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date-wise register, grouped by month */}
                    <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                        <CalendarDays size={12} /> Date-wise register
                    </p>
                    {sessions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-2">No classes match this filter.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(
                                sessions.reduce((acc, s) => {
                                    const { monthKey, monthLabel } = parseDate(s.date);
                                    (acc[monthKey] = acc[monthKey] || { label: monthLabel, rows: [] }).rows.push(s);
                                    return acc;
                                }, {})
                            )
                                .sort(([a], [b]) => b.localeCompare(a))
                                .map(([mk, grp]) => {
                                    const present = grp.rows.filter((r) => r.status === "present").length;
                                    const late = grp.rows.filter((r) => r.status === "late").length;
                                    return (
                                        <div key={mk} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                                                <span className="text-xs font-semibold text-slate-600">{grp.label}</span>
                                                <span className="text-[11px] text-slate-400">
                                                    {grp.rows.length} class{grp.rows.length > 1 ? "es" : ""} · {present + late}/{grp.rows.length} attended
                                                </span>
                                            </div>
                                            <table className="w-full text-xs">
                                                <tbody className="divide-y divide-slate-100">
                                                    {grp.rows.map((s) => {
                                                        const M = STATUS_META[s.status] || STATUS_META.absent;
                                                        const dt = parseDate(s.date);
                                                        return (
                                                            <tr key={s.date} className="text-slate-600">
                                                                <td className="py-1.5 pl-3 pr-2 whitespace-nowrap">
                                                                    <span className="font-semibold text-slate-700">{dt.day} {dt.month}</span>
                                                                    <span className="text-slate-400"> {dt.year}</span>
                                                                </td>
                                                                <td className="py-1.5 pr-3 whitespace-nowrap text-slate-500">{s.day}</td>
                                                                <td className="py-1.5 pr-3 whitespace-nowrap">{s.teacher_name}</td>
                                                                <td className="py-1.5 pr-3 text-slate-400">{s.topic || "—"}</td>
                                                                <td className="py-1.5 pr-3 text-right">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${M.cls}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${M.dot}`} />{M.label}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function StudentAttendance() {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // filters
    const [yearFilter, setYearFilter] = useState("all");
    const [semFilter, setSemFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [eligFilter, setEligFilter] = useState("all"); // all | eligible | risk
    const [statusFilter, setStatusFilter] = useState("all"); // all | present | late | absent

    useEffect(() => {
        if (!user?.id) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const prof = await axios.get(`${BACKEND_URL}/v1/auth/get/student`, {
                    params: { user_id: user.id },
                });
                const sid = prof.data?.id;
                if (!sid) throw new Error("no-profile");
                const res = await axios.get(`${BACKEND_URL}/v1/attendance/student/${sid}/lifecycle`);
                if (!cancelled) { setData(res.data); setError(""); }
            } catch (e) {
                if (!cancelled) setError(
                    e.message === "no-profile" || e.response?.status === 404
                        ? "No student profile is linked to your account yet."
                        : "Could not load your attendance."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user]);

    const years = data?.years || [];
    const semOptions = useMemo(() => {
        const set = new Set();
        years.forEach((y) => {
            if (yearFilter !== "all" && String(y.year) !== yearFilter) return;
            y.semesters.forEach((s) => set.add(s.semester));
        });
        return [...set].sort();
    }, [years, yearFilter]);

    // Apply filters -> flattened list of {year, semester, courses[]}
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const blocks = [];
        years.forEach((y) => {
            if (yearFilter !== "all" && String(y.year) !== yearFilter) return;
            y.semesters.forEach((s) => {
                if (semFilter !== "all" && s.semester !== semFilter) return;
                const courses = s.courses.filter((c) => {
                    if (eligFilter === "eligible" && !c.eligible) return false;
                    if (eligFilter === "risk" && c.eligible) return false;
                    if (q && !(`${c.course_code} ${c.title}`.toLowerCase().includes(q))) return false;
                    return true;
                });
                if (courses.length) blocks.push({ year: y, sem: s, courses });
            });
        });
        return blocks;
    }, [years, yearFilter, semFilter, eligFilter, search]);

    const anyFilter = yearFilter !== "all" || semFilter !== "all" || search ||
        eligFilter !== "all" || statusFilter !== "all";
    const clearAll = () => {
        setYearFilter("all"); setSemFilter("all"); setSearch("");
        setEligFilter("all"); setStatusFilter("all");
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-emerald-600" /> Attendance
                    </h1>
                    {data?.student && (
                        <p className="text-slate-500 text-sm">
                            {data.student.name} · Batch {data.student.batch}
                            {data.student.current_semester ? ` · Semester ${data.student.current_semester}` : ""}
                        </p>
                    )}
                </div>
                {data?.overall?.total_sessions > 0 && (
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2">
                        <Ring percentage={data.overall.percentage} size={48} />
                        <div className="text-sm">
                            <p className="font-semibold text-slate-800">Overall</p>
                            <p className="text-slate-500">{data.overall.attended}/{data.overall.total_sessions} classes</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Filters */}
            {!loading && !error && years.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 mb-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400 mr-1">
                        <Filter size={13} /> Filters
                    </span>
                    <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setSemFilter("all"); }}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
                        <option value="all">All years</option>
                        {years.map((y) => <option key={y.year} value={y.year}>{y.label}</option>)}
                    </select>
                    <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
                        <option value="all">All semesters</option>
                        {semOptions.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                    <select value={eligFilter} onChange={(e) => setEligFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
                        <option value="all">All courses</option>
                        <option value="eligible">Exam eligible (≥75%)</option>
                        <option value="risk">At risk (&lt;75%)</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5">
                        <option value="all">All classes</option>
                        <option value="present">Present only</option>
                        <option value="late">Late only</option>
                        <option value="absent">Absent only</option>
                    </select>
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search course…"
                        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-[140px]" />
                    {anyFilter && (
                        <button onClick={clearAll}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                            <X size={12} /> Clear
                        </button>
                    )}
                </div>
            )}

            {loading && <div className="bg-white border rounded-xl p-12 text-center text-slate-400">Loading attendance…</div>}
            {!loading && error && <div className="bg-white border rounded-xl p-12 text-center text-slate-500">{error}</div>}
            {!loading && !error && years.length === 0 && (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-500">No attendance records yet.</div>
            )}

            {!loading && !error && filtered.length === 0 && years.length > 0 && (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-500">No courses match these filters.</div>
            )}

            <div className="space-y-6">
                {filtered.map(({ year, sem, courses }) => (
                    <div key={`${year.year}-${sem.semester}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-slate-700">
                                {year.label} · Semester {sem.semester}
                            </h2>
                            <span className={`text-xs font-semibold ${pctColor(sem.percentage)}`}>
                                {sem.percentage}% · {sem.attended}/{sem.total_sessions}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {courses.map((c) => (
                                <CourseCard key={c.course_id} course={c} statusFilter={statusFilter} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
