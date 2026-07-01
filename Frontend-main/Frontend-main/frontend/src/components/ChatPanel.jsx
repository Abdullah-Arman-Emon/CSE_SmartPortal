import { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import { Send, Users, MessageSquare } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// role: "teacher" | "student" (profile id is resolved from the logged-in user)
function ChatPanel({ role }) {
  const { user } = useContext(AuthContext);
  const me = user?.id;
  const [profileId, setProfileId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [members, setMembers] = useState([]);
  const [target, setTarget] = useState("group"); // "group" | user_id
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const lastId = useRef(0);
  const bottom = useRef(null);

  // Resolve teacher.id / student.id from the logged-in user.
  useEffect(() => {
    if (!me) return;
    const url =
      role === "teacher"
        ? `${BACKEND_URL}/v1/teacher/profile/get?userId=${me}`
        : `${BACKEND_URL}/v1/auth/get/student?user_id=${me}`;
    axios.get(url).then((r) => setProfileId(r.data?.id)).catch(() => {});
  }, [role, me]);

  useEffect(() => {
    if (!profileId) return;
    const url =
      role === "teacher"
        ? `${BACKEND_URL}/v1/teacher/courses/my_classes/${profileId}`
        : `${BACKEND_URL}/v1/student/courses/my_classes/${profileId}`;
    axios.get(url).then((r) => setCourses(r.data || [])).catch(() => {});
  }, [role, profileId]);

  useEffect(() => {
    if (!courseId) return;
    axios
      .get(`${BACKEND_URL}/v1/chat/course/${courseId}/members`)
      .then((r) => setMembers((r.data || []).filter((m) => m.user_id !== me)))
      .catch(() => {});
  }, [courseId, me]);

  const fetchMessages = useCallback(
    async (reset = false) => {
      if (!courseId) return;
      const after = reset ? 0 : lastId.current;
      let url;
      if (target === "group") {
        url = `${BACKEND_URL}/v1/chat/course/${courseId}/group?after=${after}`;
      } else {
        url = `${BACKEND_URL}/v1/chat/course/${courseId}/dm?user_a=${me}&user_b=${target}&after=${after}`;
      }
      try {
        const r = await axios.get(url);
        const incoming = r.data || [];
        if (incoming.length) {
          lastId.current = incoming[incoming.length - 1].id;
          setMessages((prev) => (reset ? incoming : [...prev, ...incoming]));
        } else if (reset) {
          setMessages([]);
        }
      } catch { /* ignore */ }
    },
    [courseId, target, me]
  );

  // Reset + poll when course/target changes
  useEffect(() => {
    lastId.current = 0;
    setMessages([]);
    if (!courseId) return;
    fetchMessages(true);
    const t = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(t);
  }, [courseId, target, fetchMessages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !courseId) return;
    try {
      await axios.post(`${BACKEND_URL}/v1/chat/send`, {
        course_id: Number(courseId),
        sender_id: me,
        recipient_id: target === "group" ? null : Number(target),
        text: text.trim(),
      });
      setText("");
      fetchMessages(false);
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <p className="text-slate-500 text-sm">Course group chat and direct messages.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setTarget("group"); }}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select a course…</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
        </select>
        {courseId && (
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="group">👥 Group chat</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>💬 {m.name} ({m.role})</option>
            ))}
          </select>
        )}
      </div>

      {!courseId ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          Select a course to start chatting.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[60vh]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-medium">
            {target === "group" ? <Users size={18} /> : <MessageSquare size={18} />}
            {target === "group" ? "Course group" : members.find((m) => String(m.user_id) === String(target))?.name || "Direct message"}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-8">No messages yet. Say hello 👋</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === me;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                      {!mine && <p className="text-xs font-semibold text-slate-500 mb-0.5">{m.sender_name}</p>}
                      <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-amber-100" : "text-slate-400"}`}>
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottom} />
          </div>

          <div className="p-3 border-t border-slate-100 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message…"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={send} className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-lg">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
