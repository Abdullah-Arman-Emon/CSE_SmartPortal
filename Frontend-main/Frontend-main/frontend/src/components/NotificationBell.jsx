import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Bell } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function NotificationBell() {
  const { user } = useContext(AuthContext);
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
    const t = setInterval(loadCount, 30000); // poll every 30s
    return () => clearInterval(t);
  }, [uid]);

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
              items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-50 ${n.is_read ? "" : "bg-indigo-50/40"}`}
                >
                  <p className="text-sm text-slate-700">{n.text}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
