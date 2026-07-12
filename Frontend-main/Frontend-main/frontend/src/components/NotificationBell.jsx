import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Bell, MessageSquare, FileText, Calendar, DollarSign, Award, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TYPE_ICON = {
  message: { Icon: MessageSquare, cls: "text-amber-500 bg-amber-50" },
  assignment: { Icon: FileText, cls: "text-indigo-500 bg-indigo-50" },
  announcement: { Icon: Bell, cls: "text-sky-500 bg-sky-50" },
  result: { Icon: Award, cls: "text-emerald-500 bg-emerald-50" },
  routine: { Icon: Calendar, cls: "text-violet-500 bg-violet-50" },
  routine_daily: { Icon: Calendar, cls: "text-violet-500 bg-violet-50" },
  finance: { Icon: DollarSign, cls: "text-rose-500 bg-rose-50" },
};
const iconFor = (t) => TYPE_ICON[t] || { Icon: BookOpen, cls: "text-slate-400 bg-slate-100" };

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationBell() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const uid = user?.id;

  const loadCount = () => {
    if (!uid) return;
    axios
      .get(`${BACKEND_URL}/v1/notifications/${uid}/unread-count`)
      .then((r) => setCount(r.data.count || 0))
      .catch(() => {});
  };

  const loadList = () => {
    if (!uid) return;
    axios
      .get(`${BACKEND_URL}/v1/notifications/${uid}`)
      .then((r) => setItems(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    loadCount();
    const t = setInterval(() => { loadCount(); if (open) loadList(); }, 15000);
    return () => clearInterval(t);
  }, [uid, open]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const markAllRead = async () => {
    if (!uid) return;
    await axios.put(`${BACKEND_URL}/v1/notifications/user/${uid}/read-all`);
    setCount(0);
    loadList();
  };

  const openItem = async (n) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      setCount((c) => Math.max(0, c - 1));
      axios.put(`${BACKEND_URL}/v1/notifications/${n.id}/read`).catch(() => {});
    }
    setOpen(false);
    if (n.link) {
      if (/^https?:\/\//.test(n.link)) window.open(n.link, "_blank");
      else navigate(n.link);
    }
  };

  if (!uid) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-black/5 text-slate-600"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-800">Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">No notifications</div>
            ) : (
              items.map((n) => {
                const { Icon, cls } = iconFor(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className={`w-full flex items-start gap-3 text-left px-4 py-3 border-b border-slate-50 transition hover:bg-slate-50 ${n.is_read ? "" : "bg-amber-50/50"}`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cls}`}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${n.is_read ? "text-slate-600" : "text-slate-800 font-medium"}`}>{n.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-amber-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
