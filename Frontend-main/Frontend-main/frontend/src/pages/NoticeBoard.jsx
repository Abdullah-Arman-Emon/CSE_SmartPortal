import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Calendar,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Pin,
  Search,
  User,
} from "lucide-react";
import PageHero from "../components/public/PageHero";
import { resourceUrl } from "../components/public/content";
import { springSoft } from "../components/motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAGE_SIZE = 10;

const CATEGORIES = ["All", "Department", "Chairman", "Admin", "Student-Club", "Central"];

const CATEGORY_COLORS = {
  Chairman: "bg-purple-100 text-purple-700",
  Admin: "bg-sky-100 text-sky-700",
  "Student-Club": "bg-emerald-100 text-emerald-700",
  Department: "bg-indigo-100 text-indigo-700",
  Central: "bg-rose-100 text-rose-700",
};

const formatDate = (dateString) => {
  if (!dateString) return "Unknown date";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const isImage = (url) => /\.(png|jpe?g|gif|webp)$/i.test(url || "");
const fileName = (url) => decodeURIComponent((url || "").split("/").pop() || "attachment");

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Paperclip className="h-4 w-4" /> Attachments ({attachments.length})
      </h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {attachments.map((url, i) => {
          const full = resourceUrl(url);
          return isImage(url) ? (
            <a key={i} href={full} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border border-slate-200">
              <img
                src={full}
                alt={fileName(url)}
                loading="lazy"
                className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          ) : (
            <a
              key={i}
              href={full}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 hover:border-brand-300 hover:bg-white"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600">
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                {fileName(url)}
              </span>
              <Download className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-600" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function NoticeDetail({ notice }) {
  return (
    <motion.article
      key={notice.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            CATEGORY_COLORS[notice.notice_from] || "bg-slate-100 text-slate-600"
          }`}
        >
          {notice.notice_from}
        </span>
        {notice.is_pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
      </div>
      <h2 className="font-display mt-4 text-2xl font-bold leading-tight text-slate-900">
        {notice.title}
      </h2>
      {notice.sub_title && <p className="mt-1.5 text-slate-500">{notice.sub_title}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> {formatDate(notice.date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> {notice.notice_from}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {(notice.content || "")
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="leading-relaxed text-slate-600">
              {p}
            </p>
          ))}
      </div>
      <AttachmentList attachments={notice.attachments} />
    </motion.article>
  );
}

const NoticeBoard = () => {
  const reduce = useReducedMotion();
  const [notices, setNotices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("All");
  const detailRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchNotices = useCallback(
    async (offset = 0, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/guest/notices`, {
          params: {
            limit: PAGE_SIZE,
            offset,
            search: debouncedSearch || undefined,
            category: category !== "All" ? category : undefined,
          },
        });
        const items = res.data?.items || [];
        setTotal(res.data?.total || 0);
        setNotices((prev) => (append ? [...prev, ...items] : items));
        if (!append) setSelectedNotice(items[0] || null);
        setError(null);
      } catch {
        setError("Failed to load notices. Please try again later.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, category]
  );

  useEffect(() => {
    fetchNotices(0, false);
  }, [fetchNotices]);

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    if (window.innerWidth < 768 && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
  };

  const pinned = notices.filter((n) => n.is_pinned);
  const rest = notices.filter((n) => !n.is_pinned);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Announcements"
        title="Notice Board"
        sub="Official announcements from the department, chairman, administration and student clubs."
        crumbs={[{ label: "Notice Board" }]}
        stats={total > 0 ? [{ value: total, label: "Active Notices" }] : undefined}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId={reduce ? undefined : "notice-cat"}
                      className="absolute inset-0 rounded-full bg-slate-900"
                      transition={springSoft}
                    />
                  )}
                  <span className="relative">{c}</span>
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notices…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
            <div className="h-96 animate-pulse rounded-3xl bg-slate-200/70 md:col-span-2" />
          </div>
        )}
        {error && <div className="py-16 text-center text-red-600">{error}</div>}

        {!loading && !error && notices.length === 0 && (
          <div className="py-20 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="font-display mt-3 text-lg font-semibold text-slate-900">
              No notices found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term or category.
            </p>
          </div>
        )}

        {/* Master–detail */}
        {!loading && !error && notices.length > 0 && (
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* List */}
            <div className="space-y-6">
              {pinned.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-amber-600">
                    <Pin className="h-3.5 w-3.5" /> Pinned
                  </h3>
                  <div className="mt-3 space-y-3">
                    {pinned.map((n) => (
                      <NoticeListItem
                        key={n.id}
                        notice={n}
                        active={selectedNotice?.id === n.id}
                        onClick={() => handleNoticeClick(n)}
                        pinnedStyle
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                {pinned.length > 0 && (
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                    All Notices
                  </h3>
                )}
                <div className="mt-3 max-h-[42rem] space-y-3 overflow-y-auto pr-1">
                  {rest.map((n) => (
                    <NoticeListItem
                      key={n.id}
                      notice={n}
                      active={selectedNotice?.id === n.id}
                      onClick={() => handleNoticeClick(n)}
                    />
                  ))}
                </div>
              </div>
              {notices.length < total && (
                <button
                  onClick={() => fetchNotices(notices.length, true)}
                  disabled={loadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-60"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loadingMore ? "Loading…" : `Load more (${total - notices.length} remaining)`}
                </button>
              )}
            </div>

            {/* Detail */}
            <div ref={detailRef} className="md:col-span-2">
              <AnimatePresence mode="wait">
                {selectedNotice && <NoticeDetail notice={selectedNotice} />}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function NoticeListItem({ notice, active, onClick, pinnedStyle = false }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-brand-400 bg-white shadow-lg shadow-brand-500/10 ring-1 ring-brand-400/30"
          : pinnedStyle
          ? "border-amber-200 bg-amber-50/60 hover:border-amber-300 hover:bg-white"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            CATEGORY_COLORS[notice.notice_from] || "bg-slate-100 text-slate-600"
          }`}
        >
          {notice.notice_from}
        </span>
        {notice.attachments?.length > 0 && <Paperclip className="h-3 w-3 text-slate-400" />}
      </div>
      <h4
        className={`mt-2 line-clamp-2 text-sm font-semibold leading-snug ${
          active ? "text-brand-700" : "text-slate-800"
        }`}
      >
        {notice.title}
      </h4>
      <p className="mt-1.5 text-xs text-slate-400">{formatDate(notice.date)}</p>
    </button>
  );
}

export default NoticeBoard;
