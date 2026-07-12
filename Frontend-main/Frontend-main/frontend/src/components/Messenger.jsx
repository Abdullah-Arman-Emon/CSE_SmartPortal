import { useState, useEffect, useRef, useContext, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Send, Paperclip, FileText, Loader2, Search, Check, CheckCheck,
  MessageSquare, ArrowLeft, Circle, Users, Hash,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];
const isImage = (url) => IMAGE_EXTS.includes((url || "").split(".").pop().toLowerCase());

const ROLE_STYLE = {
  admin: "bg-rose-100 text-rose-700",
  teacher: "bg-indigo-100 text-indigo-700",
  student: "bg-emerald-100 text-emerald-700",
};
const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-200 text-slate-600",
  upcoming: "bg-amber-100 text-amber-700",
};

const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";

function lastSeenLabel(iso) {
  if (!iso) return "Offline";
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Active now";
  if (mins < 60) return `Active ${mins}m ago`;
  if (mins < 1440) return `Active ${Math.floor(mins / 60)}h ago`;
  return `Last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function Avatar({ name, image, online, group, size = 44 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {image ? (
        <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className={`w-full h-full rounded-full text-white flex items-center justify-center font-semibold ${
          group ? "bg-gradient-to-br from-sky-500 to-indigo-500" : "bg-gradient-to-br from-amber-400 to-orange-500"}`}
             style={{ fontSize: size * 0.36 }}>
          {group ? <Users size={size * 0.42} /> : initials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </div>
  );
}

export default function Messenger() {
  const { user } = useContext(AuthContext);
  const me = Number(user?.id);

  const [mode, setMode] = useState("people"); // people | groups
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [active, setActive] = useState(null); // { kind:'dm'|'group', ... }
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState({ online: false, last_seen: null });
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const lastId = useRef(0);
  const bottom = useRef(null);
  const fileInput = useRef(null);

  // ---- presence heartbeat ----
  useEffect(() => {
    if (!me) return;
    const beat = () => axios.post(`${BACKEND_URL}/v1/dm/heartbeat/${me}`).catch(() => {});
    beat();
    const t = setInterval(beat, 45000);
    return () => clearInterval(t);
  }, [me]);

  const loadContacts = useCallback(() => {
    if (!me) return;
    axios.get(`${BACKEND_URL}/v1/dm/directory?user_id=${me}`).then((r) => setContacts(r.data || [])).catch(() => {});
  }, [me]);

  const loadGroups = useCallback(() => {
    if (!me) return;
    axios.get(`${BACKEND_URL}/v1/chat/my_groups/${me}`).then((r) => setGroups(r.data || [])).catch(() => {});
  }, [me]);

  useEffect(() => {
    loadContacts();
    loadGroups();
    const t = setInterval(() => { loadContacts(); loadGroups(); }, 10000);
    return () => clearInterval(t);
  }, [loadContacts, loadGroups]);

  // ---- thread polling (branches on dm vs group) ----
  const fetchThread = useCallback(
    async (reset = false) => {
      if (!active) return;
      const after = reset ? 0 : lastId.current;
      try {
        if (active.kind === "group") {
          const r = await axios.get(`${BACKEND_URL}/v1/chat/course/${active.course_id}/group?after=${after}`);
          const incoming = r.data || [];
          if (reset) { setMessages(incoming); lastId.current = incoming.length ? incoming[incoming.length - 1].id : 0; }
          else if (incoming.length) {
            setMessages((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              incoming.forEach((m) => map.set(m.id, m));
              return [...map.values()].sort((a, b) => a.id - b.id);
            });
            lastId.current = incoming[incoming.length - 1].id;
          }
        } else {
          const r = await axios.get(`${BACKEND_URL}/v1/dm/thread?me=${me}&other=${active.user_id}&after=${after}`);
          const incoming = r.data?.messages || [];
          setPeer({ online: r.data?.peer_online, last_seen: r.data?.peer_last_seen });
          if (reset) { setMessages(incoming); lastId.current = incoming.length ? incoming[incoming.length - 1].id : 0; }
          else if (incoming.length) {
            setMessages((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              incoming.forEach((m) => map.set(m.id, m));
              return [...map.values()].sort((a, b) => a.id - b.id);
            });
            lastId.current = incoming[incoming.length - 1].id;
          }
        }
      } catch { /* transient */ }
    },
    [active, me]
  );

  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
    if (!active) return;
    fetchThread(true);
    const t = setInterval(() => fetchThread(false), 4000);
    const full = active.kind === "dm" ? setInterval(() => fetchThread(true), 12000) : null;
    return () => { clearInterval(t); if (full) clearInterval(full); };
  }, [active, fetchThread]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openDM = (c) => {
    setActive({ kind: "dm", ...c });
    setError("");
    setContacts((prev) => prev.map((x) => (x.user_id === c.user_id ? { ...x, unread: 0 } : x)));
    setTimeout(loadContacts, 800);
  };
  const openGroup = (g) => { setActive({ kind: "group", ...g }); setError(""); };

  const doSend = async (extra = {}) => {
    if (!active) return;
    const body = active.kind === "group"
      ? { course_id: active.course_id, sender_id: me, recipient_id: null, text: text.trim(), ...extra }
      : { sender_id: me, recipient_id: active.user_id, text: text.trim(), ...extra };
    if (!body.text && !body.attachment_url) return;
    setSending(true);
    try {
      const url = active.kind === "group" ? `${BACKEND_URL}/v1/chat/send` : `${BACKEND_URL}/v1/dm/send`;
      const r = await axios.post(url, body);
      setMessages((prev) => [...prev, r.data]);
      lastId.current = r.data.id;
      setText("");
      setError("");
      loadContacts();
    } catch (err) {
      setError(err.response?.data?.detail || "Message could not be sent — try again.");
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file) => {
    if (!file || !active) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/utility/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await doSend({ attachment_url: res.data.url, attachment_name: file.name });
    } catch (err) {
      setError(err.response?.data?.detail || "File upload failed — try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter(
      (c) => (roleFilter === "all" || c.role === roleFilter) && (!q || c.name.toLowerCase().includes(q))
    );
  }, [contacts, search, roleFilter]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => !q || g.title.toLowerCase().includes(q) || (g.code || "").toLowerCase().includes(q));
  }, [groups, search]);

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  const renderAttachment = (m, mine) => {
    if (!m.attachment_url) return null;
    if (isImage(m.attachment_url)) {
      return (
        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-1">
          <img src={m.attachment_url} alt={m.attachment_name || "image"} className="max-h-52 rounded-lg border border-black/10 object-cover" />
        </a>
      );
    }
    return (
      <a href={m.attachment_url} target="_blank" rel="noreferrer" download={m.attachment_name || true}
         className={`flex items-center gap-2 mt-1 px-2.5 py-1.5 rounded-lg text-sm ${mine ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
        <FileText size={15} />
        <span className="truncate max-w-[220px]">{m.attachment_name || "Attachment"}</span>
      </a>
    );
  };

  const grouped = useMemo(() => {
    const out = [];
    let lastDay = null;
    messages.forEach((m) => {
      const day = m.created_at ? dayLabel(m.created_at) : "";
      if (day !== lastDay) { out.push({ sep: day, id: `sep-${m.id}` }); lastDay = day; }
      out.push(m);
    });
    return out;
  }, [messages]);

  const isGroup = active?.kind === "group";

  return (
    <div className="h-[78vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
      {/* ---------------- LEFT ---------------- */}
      <aside className={`w-full sm:w-80 border-r border-slate-200 flex flex-col ${active ? "hidden sm:flex" : "flex"}`}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">Messages</h2>
            {totalUnread > 0 && (
              <span className="text-xs font-semibold bg-amber-500 text-white rounded-full px-2 py-0.5">{totalUnread} new</span>
            )}
          </div>
          {/* People / Groups switch */}
          <div className="inline-flex w-full rounded-lg bg-slate-100 p-0.5 mb-3">
            {[["people", "People"], ["groups", "Groups"]].map(([k, label]) => (
              <button key={k} onClick={() => setMode(k)}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition ${mode === k ? "bg-white shadow text-slate-800" : "text-slate-500"}`}>
                {label}{k === "groups" && groups.length ? ` (${groups.length})` : ""}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === "people" ? "Search people…" : "Search courses…"}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          {mode === "people" && (
            <div className="flex gap-1.5 mt-3">
              {["all", "student", "teacher", "admin"].map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`text-xs px-2.5 py-1 rounded-full capitalize transition ${roleFilter === r ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {r === "all" ? "All" : r + "s"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === "people" ? (
            filtered.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-10 px-4">No people found.</p>
            ) : (
              filtered.map((c) => {
                const sel = !isGroup && active?.user_id === c.user_id;
                return (
                  <button key={c.user_id} onClick={() => openDM(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-slate-50 transition ${sel ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                    <Avatar name={c.name} image={c.image} online={c.online} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 truncate">{c.name}</span>
                        {c.last_at && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(c.last_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500 truncate">
                          {c.last_text ? (c.last_from_me ? "You: " : "") + c.last_text
                            : <span className={`px-1.5 py-0.5 rounded-full ${ROLE_STYLE[c.role] || "bg-slate-100 text-slate-500"}`}>{c.role}</span>}
                        </span>
                        {c.unread > 0 && (
                          <span className="shrink-0 text-[10px] font-bold bg-amber-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{c.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : (
            filteredGroups.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-10 px-4">No course groups yet.</p>
            ) : (
              filteredGroups.map((g) => {
                const sel = isGroup && active?.course_id === g.course_id;
                return (
                  <button key={g.course_id} onClick={() => openGroup(g)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-slate-50 transition ${sel ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                    <Avatar name={g.title} group />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 truncate">{g.title}</span>
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_STYLE[g.status] || ""}`}>{g.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {g.code} · Batch {g.batch} · {g.semester} · {g.members} members
                      </p>
                    </div>
                  </button>
                );
              })
            )
          )}
        </div>
      </aside>

      {/* ---------------- RIGHT ---------------- */}
      <section className={`flex-1 flex-col ${active ? "flex" : "hidden sm:flex"}`}>
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <MessageSquare size={48} className="opacity-40" />
            <p className="text-sm">Select a conversation to start messaging.</p>
          </div>
        ) : (
          <>
            <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <button onClick={() => setActive(null)} className="sm:hidden text-slate-500 p-1"><ArrowLeft size={20} /></button>
              <Avatar name={isGroup ? active.title : active.name} image={active.image} online={!isGroup && peer.online} group={isGroup} size={40} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate flex items-center gap-2">
                  {isGroup ? active.title : active.name}
                  {isGroup ? (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLE[active.status] || ""}`}>{active.status}</span>
                  ) : (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_STYLE[active.role] || "bg-slate-100 text-slate-500"}`}>{active.role}</span>
                  )}
                </p>
                <p className="text-xs flex items-center gap-1">
                  {isGroup ? (
                    <span className="text-slate-400 flex items-center gap-1"><Hash size={11} /> Batch {active.batch} · {active.semester} · {active.members} members</span>
                  ) : peer.online ? (
                    <span className="text-green-600 flex items-center gap-1"><Circle size={7} className="fill-green-500 text-green-500" /> Active now</span>
                  ) : (
                    <span className="text-slate-400">{lastSeenLabel(peer.last_seen)}</span>
                  )}
                </p>
              </div>
            </header>

            {error && <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
              {messages.length === 0 ? (
                <p className="text-center text-slate-400 text-sm mt-10">
                  {isGroup ? "No messages in this group yet. Say hello to the batch 👋" : "No messages yet. Say hello 👋"}
                </p>
              ) : (
                grouped.map((item) =>
                  item.sep !== undefined ? (
                    <div key={item.id} className="flex justify-center my-3">
                      <span className="text-[11px] text-slate-500 bg-slate-200/70 rounded-full px-3 py-0.5">{item.sep}</span>
                    </div>
                  ) : (
                    (() => {
                      const m = item;
                      const mine = Number(m.sender_id) === me;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${mine ? "bg-amber-500 text-white rounded-br-md" : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"}`}>
                            {!mine && (isGroup || m.sender_name) && (
                              <p className="text-[11px] font-semibold text-indigo-500 mb-0.5">{m.sender_name}</p>
                            )}
                            {m.text && <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>}
                            {renderAttachment(m, mine)}
                            <div className={`flex items-center gap-1 mt-1 ${mine ? "justify-end text-amber-100" : "text-slate-400"}`}>
                              <span className="text-[10px]">
                                {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                              </span>
                              {mine && !isGroup && (m.read_at
                                ? <CheckCheck size={13} className="text-sky-200" title="Seen" />
                                : <Check size={13} title="Sent" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )
                )
              )}
              <div ref={bottom} />
            </div>

            <div className="p-3 border-t border-slate-100 flex gap-2 items-center">
              <input ref={fileInput} type="file" className="hidden" onChange={(e) => sendFile(e.target.files?.[0])} />
              <button onClick={() => fileInput.current?.click()} disabled={uploading} title="Attach a file or image"
                className="text-slate-500 hover:text-amber-600 p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </button>
              <input value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), doSend())}
                placeholder={uploading ? "Uploading attachment…" : isGroup ? "Message the whole batch…" : "Type a message…"}
                disabled={uploading}
                className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60" />
              <button onClick={() => doSend()} disabled={uploading || sending || !text.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-full disabled:opacity-40 transition">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
