import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  CheckCircle2, PlayCircle, Clock3, Trash2, ChevronDown,
  ChevronLeft, ChevronRight, BookOpen,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { toast } from "../components/ui/toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAGE_SIZE = 9;

const STATUS_META = {
  active: { label: "Active", cls: "bg-green-100 text-green-700", dot: "bg-green-500", icon: PlayCircle },
  completed: { label: "Completed", cls: "bg-slate-200 text-slate-600", dot: "bg-slate-400", icon: CheckCircle2 },
  upcoming: { label: "Upcoming", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: Clock3 },
};
const norm = (c) => c.status || (c.running ? "active" : "completed");

const Skeleton = ({ className = "h-6 w-full" }) => (
  <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
);

function StatusMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const m = STATUS_META[value] || STATUS_META.active;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${m.cls}`}
        title="Change status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
        {m.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 right-0 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <button
              key={key}
              onMouseDown={() => { onChange(key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${key === value ? "text-orange-600 font-medium" : "text-gray-700"}`}
            >
              <meta.icon size={15} /> {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CourseCard = ({ course, onDelete, onStatus }) => {
  const [deleting, setDeleting] = useState(false);
  const status = norm(course);

  const handleDelete = async () => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/v1/courses/delete/course${course.id}`);
      onDelete(course.id);
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative">
        <img
          src={course.image_url || "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800"}
          alt={course.title}
          className={`w-full h-40 object-cover ${status === "completed" ? "grayscale-[35%]" : ""}`}
        />
        <div className="absolute top-3 left-3">
          <StatusMenu value={status} onChange={(s) => onStatus(course.id, s)} />
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${course.type === "Theory" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
            {course.type}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{course.title}</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-600 mb-4">
          <p><span className="text-gray-400">Code:</span> {course.code}</p>
          <p><span className="text-gray-400">Batch:</span> {course.batch}</p>
          <p className="col-span-2"><span className="text-gray-400">Semester:</span> {course.semester}</p>
        </div>

        <div className="flex gap-2 mt-auto">
          <Link
            to={`/teacher/classroom/${course.id}`}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center py-2 px-4 rounded-lg font-medium transition-colors text-sm"
          >
            Enter Classroom
          </Link>
          {status !== "completed" ? (
            <button
              onClick={() => onStatus(course.id, "completed")}
              title="Mark this course as completed"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> <span className="hidden sm:inline">Complete</span>
            </button>
          ) : (
            <button
              onClick={() => onStatus(course.id, "active")}
              title="Reopen this course"
              className="px-3 py-2 rounded-lg text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 flex items-center gap-1.5"
            >
              <PlayCircle size={16} /> <span className="hidden sm:inline">Reopen</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50"
            title="Delete course"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyCourses() {
  const { user } = useContext(AuthContext);
  const [teacherProfile, setTeacherProfile] = useState({});
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | completed | upcoming
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user?.id) return;
    axios
      .get(`${BACKEND_URL}/v1/teacher/profile/get`, { params: { userId: user.id } })
      .then((r) => setTeacherProfile(r.data))
      .catch(() => setError("Failed to load teacher profile"));
  }, [user]);

  useEffect(() => {
    if (!teacherProfile?.id) return;
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/v1/teacher/courses/my_classes/${teacherProfile.id}`)
      .then((r) => setCourses(r.data || []))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  }, [teacherProfile]);

  const counts = useMemo(() => {
    const c = { all: courses.length, active: 0, completed: 0, upcoming: 0 };
    courses.forEach((x) => { c[norm(x)] = (c[norm(x)] || 0) + 1; });
    return c;
  }, [courses]);

  const filtered = useMemo(
    () => (filter === "all" ? courses : courses.filter((c) => norm(c) === filter)),
    [courses, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filter]);

  const handleDelete = (id) => setCourses((prev) => prev.filter((c) => c.id !== id));

  const handleStatus = async (id, status) => {
    const prev = courses;
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, status, running: status === "active" } : c)));
    try {
      await axios.patch(`${BACKEND_URL}/v1/teacher/courses/${id}/status`, null, { params: { status } });
    } catch {
      setCourses(prev); // revert
      toast.error("Could not update status — try again.");
    }
  };

  const TABS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "upcoming", label: "Upcoming" },
  ];

  if (error) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-1">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Courses</h1>
            <p className="text-sm text-gray-500 mt-0.5">Newest courses first · manage lifecycle status</p>
          </div>
          <span className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            {counts.all} total
          </span>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`text-sm px-3.5 py-1.5 rounded-full font-medium transition ${
                filter === t.key ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label} <span className={`ml-1 ${filter === t.key ? "text-orange-100" : "text-gray-400"}`}>{counts[t.key] || 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen size={44} className="mx-auto text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-600">No {filter !== "all" ? filter : ""} courses</h2>
            <p className="text-gray-500 text-sm">Create a course or switch filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((course) => (
                <CourseCard key={course.id} course={course} onDelete={handleDelete} onStatus={handleStatus} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${
                      p === pageSafe ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
