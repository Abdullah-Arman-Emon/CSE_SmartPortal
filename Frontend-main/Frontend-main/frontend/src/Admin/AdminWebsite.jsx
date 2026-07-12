import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
    Users, FileText, GraduationCap, Image as ImageIcon, Video,
    Plus, Pencil, Trash2, X, Save, Upload, ChevronDown, ChevronRight,
    Home, HeartHandshake,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import HomeTab from "./website/HomeTab";
import CommunityTab from "./website/CommunityTab";
import AdmissionContentTab from "./website/AdmissionContentTab";
import { toast } from "../components/ui/toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ---- shared helpers ---------------------------------------------------------

async function uploadFile(file) {
    const data = new FormData();
    data.append("file", file);
    const res = await axios.post(`${BACKEND_URL}/utility/upload`, data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url; // "/resources/<name>"
}

const listToText = (arr) => (Array.isArray(arr) ? arr.join("\n") : "");
const textToList = (txt) =>
    (txt || "").split("\n").map((s) => s.trim()).filter(Boolean);

const parseJsonList = (raw, fallback = []) => {
    try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : fallback;
    } catch {
        return fallback;
    }
};

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

const inputCls =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Banner({ error, success }) {
    if (!error && !success) return null;
    return (
        <div
            className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
        >
            {error || success}
        </div>
    );
}

function ImagePicker({ value, onChange, accept = "image/*", label = "Upload" }) {
    const [busy, setBusy] = useState(false);
    return (
        <div className="flex items-center gap-3">
            {value && accept.startsWith("image") && (
                <img src={value} alt="" className="w-14 h-14 rounded object-cover border" />
            )}
            <input
                className={inputCls}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="URL or upload →"
            />
            <label className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm cursor-pointer whitespace-nowrap">
                <Upload size={14} /> {busy ? "…" : label}
                <input
                    type="file"
                    accept={accept}
                    className="hidden"
                    onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setBusy(true);
                        try {
                            onChange(await uploadFile(f));
                        } catch {
                            toast.error("Upload failed");
                        } finally {
                            setBusy(false);
                            e.target.value = "";
                        }
                    }}
                />
            </label>
        </div>
    );
}

// ---- People tab -------------------------------------------------------------

const emptyPerson = {
    name: "", role: "", category: "Faculty", expertise: "", email: "", phone: "",
    office: "", office_hours: "", image_url: "", bio: "", status: "",
    display_order: 0, is_active: true,
};

function PeopleTab({ userId }) {
    const [people, setPeople] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editing, setEditing] = useState(null); // null | {id?, ...form}

    const load = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/guest/site/people?include_inactive=true`);
            setPeople(res.data);
            setError(null);
        } catch {
            setError("Could not load people");
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const save = async () => {
        const payload = {
            ...editing,
            expertise: textToList(editing.expertise),
            display_order: Number(editing.display_order) || 0,
        };
        delete payload.id;
        try {
            if (editing.id) {
                await axios.put(`${BACKEND_URL}/admin/site/people/${editing.id}?user_id=${userId}`, payload);
            } else {
                await axios.post(`${BACKEND_URL}/admin/site/people?user_id=${userId}`, payload);
            }
            setSuccess(editing.id ? "Person updated" : "Person added");
            setEditing(null);
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        }
    };

    const remove = async (p) => {
        if (!window.confirm(`Delete ${p.name}?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/site/people/${p.id}?user_id=${userId}`);
            load();
        } catch {
            setError("Delete failed");
        }
    };

    return (
        <div>
            <Banner error={error} success={success} />
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600 text-sm">{people.length} people on the /people page</p>
                <button
                    onClick={() => setEditing({ ...emptyPerson })}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    <Plus size={16} /> Add Person
                </button>
            </div>
            <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="text-left px-4 py-2">Name</th>
                            <th className="text-left px-4 py-2">Role</th>
                            <th className="text-left px-4 py-2">Category</th>
                            <th className="text-left px-4 py-2">Status</th>
                            <th className="text-left px-4 py-2">Order</th>
                            <th className="text-left px-4 py-2">Visible</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {people.map((p) => (
                            <tr key={p.id} className="border-t hover:bg-slate-50">
                                <td className="px-4 py-2">
                                    <div className="flex items-center gap-2">
                                        {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-full object-cover" />}
                                        <span className="font-medium text-slate-800">{p.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-slate-600">{p.role}</td>
                                <td className="px-4 py-2 text-slate-600">{p.category}</td>
                                <td className="px-4 py-2">{p.status && <span className="text-amber-600">{p.status}</span>}</td>
                                <td className="px-4 py-2">{p.display_order}</td>
                                <td className="px-4 py-2">{p.is_active ? "Yes" : "Hidden"}</td>
                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                    <button
                                        onClick={() =>
                                            setEditing({
                                                ...emptyPerson,
                                                ...p,
                                                image_url: p.image || "",
                                                office_hours: p.officeHours || "",
                                                expertise: listToText(p.expertise),
                                            })
                                        }
                                        className="text-indigo-600 hover:text-indigo-800 mr-3"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => remove(p)} className="text-red-500 hover:text-red-700">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editing.id ? "Edit Person" : "Add Person"}
                            </h3>
                            <button onClick={() => setEditing(null)}><X size={20} /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Name *">
                                <input className={inputCls} value={editing.name}
                                    onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                            </Field>
                            <Field label="Role / Designation">
                                <input className={inputCls} value={editing.role || ""}
                                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                                    placeholder="Professor" />
                            </Field>
                            <Field label="Category">
                                <select className={inputCls} value={editing.category || "Faculty"}
                                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                                    <option>Faculty</option>
                                    <option>Officer</option>
                                    <option>Staff</option>
                                </select>
                            </Field>
                            <Field label='Status (e.g. "On Leave", empty = none)'>
                                <input className={inputCls} value={editing.status || ""}
                                    onChange={(e) => setEditing({ ...editing, status: e.target.value })} />
                            </Field>
                            <Field label="Email">
                                <input className={inputCls} value={editing.email || ""}
                                    onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                            </Field>
                            <Field label="Phone">
                                <input className={inputCls} value={editing.phone || ""}
                                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                            </Field>
                            <Field label="Office">
                                <input className={inputCls} value={editing.office || ""}
                                    onChange={(e) => setEditing({ ...editing, office: e.target.value })} />
                            </Field>
                            <Field label="Office Hours">
                                <input className={inputCls} value={editing.office_hours || ""}
                                    onChange={(e) => setEditing({ ...editing, office_hours: e.target.value })} />
                            </Field>
                            <Field label="Display order">
                                <input type="number" className={inputCls} value={editing.display_order}
                                    onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} />
                            </Field>
                            <Field label="Visible on site">
                                <select className={inputCls} value={editing.is_active ? "yes" : "no"}
                                    onChange={(e) => setEditing({ ...editing, is_active: e.target.value === "yes" })}>
                                    <option value="yes">Yes</option>
                                    <option value="no">Hidden</option>
                                </select>
                            </Field>
                        </div>
                        <div className="mt-4 space-y-4">
                            <Field label="Photo">
                                <ImagePicker value={editing.image_url}
                                    onChange={(url) => setEditing({ ...editing, image_url: url })} />
                            </Field>
                            <Field label="Expertise (one per line)">
                                <textarea className={inputCls} rows={3} value={editing.expertise}
                                    onChange={(e) => setEditing({ ...editing, expertise: e.target.value })} />
                            </Field>
                            <Field label="Bio">
                                <textarea className={inputCls} rows={3} value={editing.bio || ""}
                                    onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
                            </Field>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditing(null)}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">Cancel</button>
                            <button onClick={save} disabled={!editing.name?.trim()}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- Chairman & About tab ---------------------------------------------------

const TEXT_KEYS = [
    ["about_text", "About Department"],
    ["history_text", "Department History"],
    ["mission_text", "Mission & Values"],
    ["chairman_message", "Message from the Chairman"],
];
const SIMPLE_KEYS = [
    ["contact_email", "Contact email"],
    ["contact_phone", "Contact phone"],
    ["contact_address", "Contact address"],
    ["contact_hours", "Contact hours"],
    ["office_hours_note", "Office hours note"],
    ["connect_heading", "Connect heading"],
    ["connect_text", "Connect / vision text"],
];

function ContentTab({ userId }) {
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/guest/site/content`)
            .then((res) => setContent(res.data))
            .catch(() => setError("Could not load site content"));
    }, []);

    if (!content) return <Banner error={error} success={null} />;

    const set = (key, value) => setContent({ ...content, [key]: value });
    const stats = parseJsonList(content.dept_stats);
    const officeHours = parseJsonList(content.office_hours);
    const timeline = parseJsonList(content.history_timeline);
    let socialLinks = {};
    try { socialLinks = JSON.parse(content.social_links) || {}; } catch { /* empty */ }

    const saveAll = async () => {
        setSaving(true);
        setError(null);
        try {
            for (const [key, value] of Object.entries(content)) {
                await axios.put(`${BACKEND_URL}/admin/site/content/${key}?user_id=${userId}`, { value });
            }
            setSuccess("Content saved — the public pages update immediately");
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Banner error={error} success={success} />
            {TEXT_KEYS.map(([key, label]) => (
                <Field key={key} label={label}>
                    <textarea className={inputCls} rows={5} value={content[key] || ""}
                        onChange={(e) => set(key, e.target.value)} />
                </Field>
            ))}
            <Field label="Chairman photo">
                <ImagePicker value={content.chairman_photo}
                    onChange={(url) => set("chairman_photo", url)} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
                {SIMPLE_KEYS.map(([key, label]) => (
                    <Field key={key} label={label}>
                        <input className={inputCls} value={content[key] || ""}
                            onChange={(e) => set(key, e.target.value)} />
                    </Field>
                ))}
            </div>
            <Field label="Research areas (one per line)">
                <textarea className={inputCls} rows={4}
                    value={listToText(parseJsonList(content.research_areas))}
                    onChange={(e) => set("research_areas", JSON.stringify(textToList(e.target.value)))} />
            </Field>
            <Field label="Key achievements (one per line)">
                <textarea className={inputCls} rows={4}
                    value={listToText(parseJsonList(content.achievements))}
                    onChange={(e) => set("achievements", JSON.stringify(textToList(e.target.value)))} />
            </Field>
            <Field label="Department stats">
                <div className="space-y-2">
                    {stats.map((s, i) => (
                        <div key={i} className="flex gap-2">
                            <input className={inputCls} value={s.label || ""} placeholder="Label"
                                onChange={(e) => {
                                    const next = [...stats];
                                    next[i] = { ...next[i], label: e.target.value };
                                    set("dept_stats", JSON.stringify(next));
                                }} />
                            <input className={`${inputCls} max-w-[120px]`} value={s.value || ""} placeholder="25+"
                                onChange={(e) => {
                                    const next = [...stats];
                                    next[i] = { ...next[i], value: e.target.value };
                                    set("dept_stats", JSON.stringify(next));
                                }} />
                            <button onClick={() => set("dept_stats", JSON.stringify(stats.filter((_, j) => j !== i)))}
                                className="text-red-500"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={() => set("dept_stats", JSON.stringify([...stats, { label: "", value: "" }]))}
                        className="text-sm text-indigo-600 inline-flex items-center gap-1"><Plus size={14} /> Add stat</button>
                </div>
            </Field>
            <Field label="Chairman office hours">
                <div className="space-y-2">
                    {officeHours.map((s, i) => (
                        <div key={i} className="flex gap-2">
                            <input className={inputCls} value={s.days || ""} placeholder="Monday - Wednesday"
                                onChange={(e) => {
                                    const next = [...officeHours];
                                    next[i] = { ...next[i], days: e.target.value };
                                    set("office_hours", JSON.stringify(next));
                                }} />
                            <input className={inputCls} value={s.time || ""} placeholder="10:00 AM - 12:00 PM"
                                onChange={(e) => {
                                    const next = [...officeHours];
                                    next[i] = { ...next[i], time: e.target.value };
                                    set("office_hours", JSON.stringify(next));
                                }} />
                            <button onClick={() => set("office_hours", JSON.stringify(officeHours.filter((_, j) => j !== i)))}
                                className="text-red-500"><Trash2 size={16} /></button>
                        </div>
                    ))}
                    <button onClick={() => set("office_hours", JSON.stringify([...officeHours, { days: "", time: "" }]))}
                        className="text-sm text-indigo-600 inline-flex items-center gap-1"><Plus size={14} /> Add row</button>
                </div>
            </Field>
            <Field label="History timeline (shown on /chairman)">
                <div className="space-y-2">
                    {timeline.map((t, i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                            <div className="flex gap-2">
                                <input className={`${inputCls} max-w-[110px]`} value={t.year || ""} placeholder="1992"
                                    onChange={(e) => {
                                        const next = [...timeline];
                                        next[i] = { ...next[i], year: e.target.value };
                                        set("history_timeline", JSON.stringify(next));
                                    }} />
                                <input className={inputCls} value={t.title || ""} placeholder="Milestone title"
                                    onChange={(e) => {
                                        const next = [...timeline];
                                        next[i] = { ...next[i], title: e.target.value };
                                        set("history_timeline", JSON.stringify(next));
                                    }} />
                                <button onClick={() => set("history_timeline", JSON.stringify(timeline.filter((_, j) => j !== i)))}
                                    className="text-red-500"><Trash2 size={16} /></button>
                            </div>
                            <textarea className={inputCls} rows={2} value={t.description || ""} placeholder="Description"
                                onChange={(e) => {
                                    const next = [...timeline];
                                    next[i] = { ...next[i], description: e.target.value };
                                    set("history_timeline", JSON.stringify(next));
                                }} />
                        </div>
                    ))}
                    <button onClick={() => set("history_timeline", JSON.stringify([...timeline, { year: "", title: "", description: "" }]))}
                        className="text-sm text-indigo-600 inline-flex items-center gap-1"><Plus size={14} /> Add milestone</button>
                </div>
            </Field>
            <Field label="Footer about text (public site footer)">
                <textarea className={inputCls} rows={3} value={content.footer_about || ""}
                    onChange={(e) => set("footer_about", e.target.value)} />
            </Field>
            <Field label="Social links (footer icons — leave blank to hide)">
                <div className="grid sm:grid-cols-2 gap-2">
                    {["facebook", "linkedin", "github", "youtube", "x"].map((k) => (
                        <input key={k} className={inputCls} value={socialLinks[k] || ""} placeholder={`${k} URL`}
                            onChange={(e) =>
                                set("social_links", JSON.stringify({ ...socialLinks, [k]: e.target.value }))
                            } />
                    ))}
                </div>
            </Field>
            <div className="flex justify-end">
                <button onClick={saveAll} disabled={saving}
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
                    <Save size={16} /> {saving ? "Saving…" : "Save all"}
                </button>
            </div>
        </div>
    );
}

// ---- Programs tab -----------------------------------------------------------

const emptyProgram = {
    title: "", level: "Bachelor", description: "", image_url: "", credits: "",
    duration: "", students_enrolled: "", application_deadline: "", tuition_fee: "",
    admission_requirements: "", career_prospects: "", display_order: 0, is_active: true,
};
const emptyCourse = {
    code: "", title: "", semester: "", year: "", credits: "", description: "",
    image_url: "", instructor: "", weeks: [],
};

function ProgramsTab({ userId }) {
    const [programs, setPrograms] = useState([]);
    const [coursesByProgram, setCoursesByProgram] = useState({});
    const [openProgram, setOpenProgram] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editing, setEditing] = useState(null);          // program modal
    const [editingCourse, setEditingCourse] = useState(null); // course modal {program_id, ...}

    const load = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/guest/site/programs?include_inactive=true`);
            setPrograms(res.data);
            setError(null);
        } catch {
            setError("Could not load programs");
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const loadCourses = async (programId) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/guest/site/programs/${programId}/courses`);
            setCoursesByProgram((prev) => ({ ...prev, [programId]: res.data }));
        } catch {
            setError("Could not load courses");
        }
    };

    const toggleProgram = (id) => {
        const next = openProgram === id ? null : id;
        setOpenProgram(next);
        if (next && !coursesByProgram[next]) loadCourses(next);
    };

    const saveProgram = async () => {
        const payload = {
            ...editing,
            display_order: Number(editing.display_order) || 0,
            admission_requirements: textToList(editing.admission_requirements),
            career_prospects: textToList(editing.career_prospects),
        };
        delete payload.id;
        try {
            if (editing.id) {
                await axios.put(`${BACKEND_URL}/admin/site/programs/${editing.id}?user_id=${userId}`, payload);
            } else {
                await axios.post(`${BACKEND_URL}/admin/site/programs?user_id=${userId}`, payload);
            }
            setSuccess(editing.id ? "Program updated" : "Program added");
            setEditing(null);
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        }
    };

    const removeProgram = async (p) => {
        if (!window.confirm(`Delete "${p.title}" and all its courses?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/site/programs/${p.id}?user_id=${userId}`);
            load();
        } catch {
            setError("Delete failed");
        }
    };

    const saveCourse = async () => {
        const payload = {
            ...editingCourse,
            year: editingCourse.year === "" ? null : Number(editingCourse.year),
            credits: editingCourse.credits === "" ? null : Number(editingCourse.credits),
            syllabus_weeks: (editingCourse.weeks || []).map((w, i) => ({
                number: Number(w.number) || i + 1,
                topic: w.topic || "",
                date: w.date || "",
                description: w.description || "",
            })),
        };
        delete payload.id;
        delete payload.weeks;
        try {
            if (editingCourse.id) {
                await axios.put(`${BACKEND_URL}/admin/site/courses/${editingCourse.id}?user_id=${userId}`, payload);
            } else {
                await axios.post(`${BACKEND_URL}/admin/site/courses?user_id=${userId}`, payload);
            }
            setSuccess(editingCourse.id ? "Course updated" : "Course added");
            const pid = editingCourse.program_id;
            setEditingCourse(null);
            loadCourses(pid);
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        }
    };

    const removeCourse = async (c) => {
        if (!window.confirm(`Delete course "${c.title}"?`)) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/site/courses/${c.id}?user_id=${userId}`);
            loadCourses(c.program_id);
        } catch {
            setError("Delete failed");
        }
    };

    const setWeek = (i, patch) => {
        const weeks = [...(editingCourse.weeks || [])];
        weeks[i] = { ...weeks[i], ...patch };
        setEditingCourse({ ...editingCourse, weeks });
    };

    return (
        <div>
            <Banner error={error} success={success} />
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600 text-sm">
                    {programs.length} programs on /admission-hub — expand one to manage its courses & syllabus
                </p>
                <button onClick={() => setEditing({ ...emptyProgram })}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                    <Plus size={16} /> Add Program
                </button>
            </div>
            <div className="space-y-3">
                {programs.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <button onClick={() => toggleProgram(p.id)} className="text-slate-500">
                                {openProgram === p.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            {p.imageUrl && <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{p.title}</p>
                                <p className="text-xs text-slate-500">
                                    {p.level} · {p.credits} credits · {p.duration}
                                    {!p.is_active && <span className="text-red-500 ml-2">Hidden</span>}
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    setEditing({
                                        ...emptyProgram,
                                        ...p,
                                        image_url: p.imageUrl || "",
                                        students_enrolled: p.studentsEnrolled || "",
                                        application_deadline: p.applicationDeadline || "",
                                        tuition_fee: p.tuitionFee || "",
                                        admission_requirements: listToText(p.admissionRequirements),
                                        career_prospects: listToText(p.careerProspects),
                                    })
                                }
                                className="text-indigo-600 hover:text-indigo-800"
                            >
                                <Pencil size={16} />
                            </button>
                            <button onClick={() => removeProgram(p)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {openProgram === p.id && (
                            <div className="border-t px-4 py-3 bg-slate-50 rounded-b-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-slate-700">
                                        Courses ({(coursesByProgram[p.id] || []).length})
                                    </p>
                                    <button
                                        onClick={() => setEditingCourse({ ...emptyCourse, program_id: p.id })}
                                        className="text-sm text-indigo-600 inline-flex items-center gap-1">
                                        <Plus size={14} /> Add course
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {(coursesByProgram[p.id] || []).map((c) => (
                                        <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-800 truncate">
                                                    <span className="font-mono text-slate-500 mr-2">{c.code}</span>
                                                    {c.title}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {c.semester} · Year {c.year} · {c.credits} cr
                                                    {c.weeks?.length > 0 && ` · ${c.weeks.length}-week syllabus`}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setEditingCourse({ ...emptyCourse, ...c, year: c.year ?? "", credits: c.credits ?? "", image_url: c.imageUrl || "", weeks: c.weeks || [] })}
                                                className="text-indigo-600 hover:text-indigo-800">
                                                <Pencil size={15} />
                                            </button>
                                            <button onClick={() => removeCourse(c)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                    {(coursesByProgram[p.id] || []).length === 0 && (
                                        <p className="text-xs text-slate-400 py-1">No courses yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editing.id ? "Edit Program" : "Add Program"}
                            </h3>
                            <button onClick={() => setEditing(null)}><X size={20} /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Title *">
                                <input className={inputCls} value={editing.title}
                                    onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                            </Field>
                            <Field label="Level">
                                <select className={inputCls} value={editing.level}
                                    onChange={(e) => setEditing({ ...editing, level: e.target.value })}>
                                    <option>Bachelor</option>
                                    <option>Masters</option>
                                    <option>Doctorate</option>
                                </select>
                            </Field>
                            <Field label="Credits"><input className={inputCls} value={editing.credits || ""}
                                onChange={(e) => setEditing({ ...editing, credits: e.target.value })} /></Field>
                            <Field label="Duration"><input className={inputCls} value={editing.duration || ""}
                                onChange={(e) => setEditing({ ...editing, duration: e.target.value })} /></Field>
                            <Field label="Students enrolled"><input className={inputCls} value={editing.students_enrolled || ""}
                                onChange={(e) => setEditing({ ...editing, students_enrolled: e.target.value })} /></Field>
                            <Field label="Application deadline"><input className={inputCls} value={editing.application_deadline || ""}
                                onChange={(e) => setEditing({ ...editing, application_deadline: e.target.value })} /></Field>
                            <Field label="Tuition fee"><input className={inputCls} value={editing.tuition_fee || ""}
                                onChange={(e) => setEditing({ ...editing, tuition_fee: e.target.value })} /></Field>
                            <Field label="Display order"><input type="number" className={inputCls} value={editing.display_order}
                                onChange={(e) => setEditing({ ...editing, display_order: e.target.value })} /></Field>
                            <Field label="Visible on site">
                                <select className={inputCls} value={editing.is_active ? "yes" : "no"}
                                    onChange={(e) => setEditing({ ...editing, is_active: e.target.value === "yes" })}>
                                    <option value="yes">Yes</option>
                                    <option value="no">Hidden</option>
                                </select>
                            </Field>
                        </div>
                        <div className="mt-4 space-y-4">
                            <Field label="Cover image">
                                <ImagePicker value={editing.image_url}
                                    onChange={(url) => setEditing({ ...editing, image_url: url })} />
                            </Field>
                            <Field label="Description">
                                <textarea className={inputCls} rows={3} value={editing.description || ""}
                                    onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                            </Field>
                            <Field label="Admission requirements (one per line)">
                                <textarea className={inputCls} rows={3} value={editing.admission_requirements}
                                    onChange={(e) => setEditing({ ...editing, admission_requirements: e.target.value })} />
                            </Field>
                            <Field label="Career prospects (one per line)">
                                <textarea className={inputCls} rows={3} value={editing.career_prospects}
                                    onChange={(e) => setEditing({ ...editing, career_prospects: e.target.value })} />
                            </Field>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditing(null)}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">Cancel</button>
                            <button onClick={saveProgram} disabled={!editing.title?.trim()}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingCourse && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingCourse.id ? "Edit Course" : "Add Course"}
                            </h3>
                            <button onClick={() => setEditingCourse(null)}><X size={20} /></button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Field label="Code"><input className={inputCls} value={editingCourse.code || ""}
                                onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })} /></Field>
                            <Field label="Title *"><input className={inputCls} value={editingCourse.title}
                                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} /></Field>
                            <Field label='Semester (e.g. "Fall 2025")'><input className={inputCls} value={editingCourse.semester || ""}
                                onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value })} /></Field>
                            <Field label="Year"><input type="number" className={inputCls} value={editingCourse.year}
                                onChange={(e) => setEditingCourse({ ...editingCourse, year: e.target.value })} /></Field>
                            <Field label="Credits"><input type="number" step="0.25" className={inputCls} value={editingCourse.credits}
                                onChange={(e) => setEditingCourse({ ...editingCourse, credits: e.target.value })} /></Field>
                            <Field label="Instructor"><input className={inputCls} value={editingCourse.instructor || ""}
                                onChange={(e) => setEditingCourse({ ...editingCourse, instructor: e.target.value })} /></Field>
                        </div>
                        <div className="mt-4 space-y-4">
                            <Field label="Cover image">
                                <ImagePicker value={editingCourse.image_url}
                                    onChange={(url) => setEditingCourse({ ...editingCourse, image_url: url })} />
                            </Field>
                            <Field label="Description">
                                <textarea className={inputCls} rows={2} value={editingCourse.description || ""}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                            </Field>
                            <Field label={`Week-by-week syllabus (${(editingCourse.weeks || []).length} weeks)`}>
                                <div className="space-y-2">
                                    {(editingCourse.weeks || []).map((w, i) => (
                                        <div key={i} className="border rounded-lg p-2 space-y-2 bg-slate-50">
                                            <div className="flex gap-2">
                                                <input type="number" className={`${inputCls} max-w-[80px]`} value={w.number ?? i + 1}
                                                    onChange={(e) => setWeek(i, { number: e.target.value })} placeholder="#" />
                                                <input className={inputCls} value={w.topic || ""} placeholder="Topic"
                                                    onChange={(e) => setWeek(i, { topic: e.target.value })} />
                                                <input className={`${inputCls} max-w-[140px]`} value={w.date || ""} placeholder="Date"
                                                    onChange={(e) => setWeek(i, { date: e.target.value })} />
                                                <button className="text-red-500"
                                                    onClick={() => setEditingCourse({
                                                        ...editingCourse,
                                                        weeks: editingCourse.weeks.filter((_, j) => j !== i),
                                                    })}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <input className={inputCls} value={w.description || ""} placeholder="Description"
                                                onChange={(e) => setWeek(i, { description: e.target.value })} />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditingCourse({
                                            ...editingCourse,
                                            weeks: [...(editingCourse.weeks || []), { number: (editingCourse.weeks?.length || 0) + 1, topic: "", date: "", description: "" }],
                                        })}
                                        className="text-sm text-indigo-600 inline-flex items-center gap-1">
                                        <Plus size={14} /> Add week
                                    </button>
                                </div>
                            </Field>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setEditingCourse(null)}
                                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm">Cancel</button>
                            <button onClick={saveCourse} disabled={!editingCourse.title?.trim()}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---- Gallery tab ------------------------------------------------------------

function GalleryTab({ userId }) {
    const [images, setImages] = useState([]);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/guest/site/gallery?include_inactive=true`);
            setImages(res.data);
            setError(null);
        } catch {
            setError("Could not load gallery");
        }
    }, []);
    useEffect(() => { load(); }, [load]);

    const addImage = async (file) => {
        setBusy(true);
        try {
            const url = await uploadFile(file);
            await axios.post(`${BACKEND_URL}/admin/site/gallery?user_id=${userId}`, {
                image_url: url,
                caption: "",
                display_order: images.length,
            });
            load();
        } catch (e) {
            setError(e.response?.data?.detail || "Upload failed");
        } finally {
            setBusy(false);
        }
    };

    const patch = async (id, body) => {
        try {
            await axios.put(`${BACKEND_URL}/admin/site/gallery/${id}?user_id=${userId}`, body);
            load();
        } catch {
            setError("Update failed");
        }
    };

    const remove = async (g) => {
        if (!window.confirm("Delete this image from the homepage gallery?")) return;
        try {
            await axios.delete(`${BACKEND_URL}/admin/site/gallery/${g.id}?user_id=${userId}`);
            load();
        } catch {
            setError("Delete failed");
        }
    };

    return (
        <div>
            <Banner error={error} success={null} />
            <div className="flex justify-between items-center mb-4">
                <p className="text-slate-600 text-sm">{images.length} images in the homepage gallery carousel</p>
                <label className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
                    <Upload size={16} /> {busy ? "Uploading…" : "Add image"}
                    <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) addImage(f);
                            e.target.value = "";
                        }} />
                </label>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((g) => (
                    <div key={g.id} className="bg-white rounded-xl border overflow-hidden">
                        <img src={g.image_url} alt={g.caption || ""} className="w-full h-40 object-cover" />
                        <div className="p-3 space-y-2">
                            <input className={inputCls} defaultValue={g.caption || ""} placeholder="Caption (optional)"
                                onBlur={(e) => e.target.value !== (g.caption || "") && patch(g.id, { caption: e.target.value })} />
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Order</span>
                                <input type="number" className={`${inputCls} max-w-[80px]`} defaultValue={g.display_order}
                                    onBlur={(e) => Number(e.target.value) !== g.display_order && patch(g.id, { display_order: Number(e.target.value) || 0 })} />
                                <button
                                    onClick={() => patch(g.id, { is_active: !g.is_active })}
                                    className={`text-xs px-2 py-1 rounded ${g.is_active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                                    {g.is_active ? "Visible" : "Hidden"}
                                </button>
                                <button onClick={() => remove(g)} className="ml-auto text-red-500 hover:text-red-700">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ---- Campus Life tab --------------------------------------------------------

const CAMPUS_KEYS = ["campus_life_text", "campus_life_video", "campus_life_caption_title", "campus_life_caption_sub"];

function CampusTab({ userId }) {
    const [content, setContent] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/guest/site/content?keys=${CAMPUS_KEYS.join(",")}`)
            .then((res) => setContent(res.data))
            .catch(() => setError("Could not load campus life content"));
    }, []);

    if (!content) return <Banner error={error} success={null} />;
    const set = (key, value) => setContent({ ...content, [key]: value });

    const saveAll = async () => {
        setSaving(true);
        try {
            for (const key of CAMPUS_KEYS) {
                await axios.put(`${BACKEND_URL}/admin/site/content/${key}?user_id=${userId}`, {
                    value: content[key] || "",
                });
            }
            setSuccess("Campus Life section saved");
            setError(null);
        } catch (e) {
            setError(e.response?.data?.detail || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 max-w-2xl">
            <Banner error={error} success={success} />
            <Field label="Section text (below the Campus Life heading)">
                <textarea className={inputCls} rows={3} value={content.campus_life_text || ""}
                    onChange={(e) => set("campus_life_text", e.target.value)} />
            </Field>
            <Field label="Video (upload a .mp4 — max 50 MB — or paste a URL)">
                <ImagePicker value={content.campus_life_video} accept="video/mp4"
                    onChange={(url) => set("campus_life_video", url)} label="Upload video" />
            </Field>
            {content.campus_life_video && (
                <video src={content.campus_life_video} controls muted className="w-full rounded-xl border" />
            )}
            <Field label="Video caption title">
                <input className={inputCls} value={content.campus_life_caption_title || ""}
                    onChange={(e) => set("campus_life_caption_title", e.target.value)} />
            </Field>
            <Field label="Video caption subtitle">
                <input className={inputCls} value={content.campus_life_caption_sub || ""}
                    onChange={(e) => set("campus_life_caption_sub", e.target.value)} />
            </Field>
            <div className="flex justify-end">
                <button onClick={saveAll} disabled={saving}
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm disabled:opacity-50">
                    <Save size={16} /> {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </div>
    );
}

// ---- shell ------------------------------------------------------------------

const SUB_TABS = [
    { id: "home", label: "Home Page", icon: Home },
    { id: "people", label: "People", icon: Users },
    { id: "content", label: "Chairman & About", icon: FileText },
    { id: "programs", label: "Programs", icon: GraduationCap },
    { id: "community", label: "Community", icon: HeartHandshake },
    { id: "gallery", label: "Gallery", icon: ImageIcon },
    { id: "campus", label: "Campus Life", icon: Video },
];

function AdminWebsite() {
    const { user } = useContext(AuthContext);
    const [tab, setTab] = useState("people");
    const userId = user?.id;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Website Content</h2>
                <p className="text-slate-500 text-sm">
                    Everything here is shown on the public pages (/people, /chairman, /admission-hub, homepage gallery & campus life) — changes go live immediately.
                </p>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
                {SUB_TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === id ? "bg-indigo-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"
                        }`}>
                        <Icon size={16} /> {label}
                    </button>
                ))}
            </div>
            {tab === "home" && <HomeTab userId={userId} />}
            {tab === "people" && <PeopleTab userId={userId} />}
            {tab === "content" && <ContentTab userId={userId} />}
            {tab === "programs" && (
                <>
                    <AdmissionContentTab userId={userId} />
                    <ProgramsTab userId={userId} />
                </>
            )}
            {tab === "community" && <CommunityTab userId={userId} />}
            {tab === "gallery" && <GalleryTab userId={userId} />}
            {tab === "campus" && <CampusTab userId={userId} />}
        </div>
    );
}

export default AdminWebsite;
