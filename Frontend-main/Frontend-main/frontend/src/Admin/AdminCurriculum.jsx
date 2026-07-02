import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { BookOpen, Search, Pencil, Plus, X, Check } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORIES = ["general", "core", "elective1", "elective2", "elective3", "project"];
const CATEGORY_LABELS = {
  general: "General Education",
  core: "Core",
  elective1: "Elective I",
  elective2: "Elective II",
  elective3: "Elective III",
  project: "Project / Internship",
};
const CATEGORY_STYLES = {
  general: "bg-amber-100 text-amber-800",
  core: "bg-blue-100 text-blue-800",
  elective1: "bg-purple-100 text-purple-800",
  elective2: "bg-fuchsia-100 text-fuchsia-800",
  elective3: "bg-pink-100 text-pink-800",
  project: "bg-green-100 text-green-800",
};

const EMPTY_FORM = {
  program: "bsc",
  course_code: "",
  title: "",
  credit: "3",
  category: "core",
  is_lab: false,
  year: "",
  semester_no: "",
};

function AdminCurriculum() {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState({ type: "", text: "" });

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  // add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  const fetchCourses = () => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/v1/curriculum`)
      .then((res) => setCourses(res.data || []))
      .catch((err) => console.error("curriculum", err))
      .finally(() => setLoading(false));
  };

  useEffect(fetchCourses, []);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({
      title: c.title,
      credit: String(c.credit),
      category: c.category,
      is_lab: c.is_lab,
      year: c.year ?? "",
      semester_no: c.semester_no ?? "",
    });
  };

  const saveEdit = async (id) => {
    try {
      const payload = {
        title: editForm.title,
        credit: parseFloat(editForm.credit),
        category: editForm.category,
        is_lab: editForm.is_lab,
        year: editForm.year === "" ? null : parseInt(editForm.year),
        semester_no: editForm.semester_no === "" ? null : parseInt(editForm.semester_no),
      };
      const res = await axios.put(
        `${BACKEND_URL}/v1/curriculum/${id}?user_id=${user.id}`,
        payload
      );
      setCourses((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      setEditingId(null);
      flash("success", `${res.data.course_code} updated`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to update course");
    }
  };

  const addCourse = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        program: addForm.program,
        course_code: addForm.course_code.trim(),
        title: addForm.title.trim(),
        credit: parseFloat(addForm.credit),
        category: addForm.category,
        is_lab: addForm.is_lab,
        year: addForm.year === "" ? null : parseInt(addForm.year),
        semester_no: addForm.semester_no === "" ? null : parseInt(addForm.semester_no),
      };
      const res = await axios.post(`${BACKEND_URL}/v1/curriculum?user_id=${user.id}`, payload);
      setCourses((prev) =>
        [...prev, res.data].sort((a, b) => a.course_code.localeCompare(b.course_code))
      );
      setAddForm(EMPTY_FORM);
      setShowAdd(false);
      flash("success", `${res.data.course_code} added to catalog`);
    } catch (err) {
      flash("error", err.response?.data?.detail || "Failed to add course");
    }
  };

  const semesters = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

  const filtered = courses.filter((c) => {
    if (programFilter !== "all" && c.program !== programFilter) return false;
    if (semesterFilter !== "all" && c.semester !== semesterFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    const q = search.toLowerCase();
    return c.course_code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  const totalCredits = filtered.reduce((s, c) => s + (c.credit || 0), 0);

  const inputCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Catalog</h1>
          <p className="text-gray-600 mt-1">
            Official DU CSE curriculum — courses teachers can offer. BSc is seeded; add MSc courses here.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />} {showAdd ? "Cancel" : "Add Course"}
        </button>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {showAdd && (
        <form onSubmit={addCourse} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={addForm.program}
            onChange={(e) => setAddForm((f) => ({ ...f, program: e.target.value }))}
            className={inputCls}
          >
            <option value="bsc">BSc</option>
            <option value="msc">MSc</option>
          </select>
          <input
            required
            placeholder="Course code (e.g. CSE 5101)"
            value={addForm.course_code}
            onChange={(e) => setAddForm((f) => ({ ...f, course_code: e.target.value }))}
            className={inputCls}
          />
          <input
            required
            placeholder="Title"
            value={addForm.title}
            onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
            className={`${inputCls} col-span-2`}
          />
          <input
            required
            type="number"
            step="0.25"
            min="0.5"
            placeholder="Credit"
            value={addForm.credit}
            onChange={(e) => setAddForm((f) => ({ ...f, credit: e.target.value }))}
            className={inputCls}
          />
          <select
            value={addForm.category}
            onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="4"
            placeholder="Year (blank for MSc)"
            value={addForm.year}
            onChange={(e) => setAddForm((f) => ({ ...f, year: e.target.value }))}
            className={inputCls}
          />
          <input
            type="number"
            min="1"
            max="2"
            placeholder="Semester (1/2)"
            value={addForm.semester_no}
            onChange={(e) => setAddForm((f) => ({ ...f, semester_no: e.target.value }))}
            className={inputCls}
          />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={addForm.is_lab}
              onChange={(e) => setAddForm((f) => ({ ...f, is_lab: e.target.checked }))}
            />
            Lab course
          </label>
          <button
            type="submit"
            className="col-span-2 md:col-span-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Save to Catalog
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
        </div>
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className={inputCls}>
          <option value="all">All Programs</option>
          <option value="bsc">BSc</option>
          <option value="msc">MSc</option>
        </select>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className={inputCls}>
          <option value="all">All Semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls}>
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">
          {filtered.length} courses · {totalCredits.toFixed(2)} credits
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading curriculum...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Credit</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {c.course_code}
                    {c.program === "msc" && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">MSc</span>
                    )}
                  </td>
                  {editingId === c.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                          className={`${inputCls} w-full`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.25"
                          value={editForm.credit}
                          onChange={(e) => setEditForm((f) => ({ ...f, credit: e.target.value }))}
                          className={`${inputCls} w-20`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                          className={inputCls}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="number" min="1" max="4"
                          value={editForm.year}
                          onChange={(e) => setEditForm((f) => ({ ...f, year: e.target.value }))}
                          className={`${inputCls} w-14`}
                        />
                        {" - "}
                        <input
                          type="number" min="1" max="2"
                          value={editForm.semester_no}
                          onChange={(e) => setEditForm((f) => ({ ...f, semester_no: e.target.value }))}
                          className={`${inputCls} w-14`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={editForm.is_lab}
                            onChange={(e) => setEditForm((f) => ({ ...f, is_lab: e.target.checked }))}
                          />
                          Lab
                        </label>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button onClick={() => saveEdit(c.id)} className="text-green-600 hover:text-green-800 p-1" title="Save">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1" title="Cancel">
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-700">{c.title}</td>
                      <td className="px-4 py-3">{c.credit}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_STYLES[c.category] || "bg-gray-100 text-gray-700"}`}>
                          {CATEGORY_LABELS[c.category] || c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{c.semester || "—"}</td>
                      <td className="px-4 py-3">{c.is_lab ? "Lab" : "Theory"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => startEdit(c)} className="text-indigo-600 hover:text-indigo-800 p-1" title="Edit">
                          <Pencil size={15} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <BookOpen size={24} className="mx-auto mb-2" />
                    No courses match. Run <code>python seed_curriculum.py</code> on the backend to load the DU BSc catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminCurriculum;
