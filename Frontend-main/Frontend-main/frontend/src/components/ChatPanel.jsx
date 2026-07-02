import { useState, useEffect, useRef, useContext, useCallback } from "react";
import axios from "axios";
import { Send, Users, MessageSquare, Paperclip, FileText, Loader2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp"];
const isImage = (url) => {
  const ext = (url || "").split(".").pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
};

// role: "teacher" | "student" (profile id is resolved from the logged-in user)
function ChatPanel({ role }) {
  const { user } = useContext(AuthContext);
  const me = Number(user?.id);
  const [profileId, setProfileId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [members, setMembers] = useState([]);
  const [target, setTarget] = useState("group"); // "group" | user_id
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lastId = useRef(0);
  const bottom = useRef(null);
  const fileInput = useRef(null);

  // Resolve teacher.id / student.id from the logged-in user.
  useEffect(() => {
    if (!me) return;
    const url =
      role === "teacher"
        ? `${BACKEND_URL}/v1/teacher/profile/get?userId=${me}`
        : `${BACKEND_URL}/v1/auth/get/student?user_id=${me}`;
    axios
      .get(url)
      .then((r) => {
        setProfileId(r.data?.id);
        setError("");
      })
      .catch(() => setError("Could not load your profile — refresh the page or log in again."));
  }, [role, me]);

  useEffect(() => {
    if (!profileId) return;
    const url =
      role === "teacher"
        ? `${BACKEND_URL}/v1/teacher/courses/my_classes/${profileId}`
        : `${BACKEND_URL}/v1/student/courses/my_classes/${profileId}`;
    axios
      .get(url)
      .then((r) => {
        setCourses(r.data || []);
        setCoursesLoaded(true);
        setError("");
      })
      .catch(() => setError("Could not load your courses — please try again."));
  }, [role, profileId]);

  useEffect(() => {
    if (!courseId) return;
    axios
      .get(`${BACKEND_URL}/v1/chat/course/${courseId}/members`)
      .then((r) => setMembers((r.data || []).filter((m) => Number(m.user_id) !== me)))
      .catch(() => setError("Could not load course members."));
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
      } catch { /* polling errors are transient — keep the last good view */ }
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

  const sendPayload = async (payload) => {
    try {
      await axios.post(`${BACKEND_URL}/v1/chat/send`, payload);
      setError("");
      fetchMessages(false);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || "Message could not be sent — try again.");
      return false;
    }
  };

  const send = async () => {
    if (!text.trim() || !courseId) return;
    const ok = await sendPayload({
      course_id: Number(courseId),
      sender_id: me,
      recipient_id: target === "group" ? null : Number(target),
      text: text.trim(),
    });
    if (ok) setText("");
  };

  const sendFile = async (file) => {
    if (!file || !courseId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/utility/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await sendPayload({
        course_id: Number(courseId),
        sender_id: me,
        recipient_id: target === "group" ? null : Number(target),
        text: text.trim(), // optional caption
        attachment_url: res.data.url,
        attachment_name: file.name,
      });
      setText("");
    } catch (err) {
      setError(err.response?.data?.detail || "File upload failed — try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const renderAttachment = (m, mine) => {
    if (!m.attachment_url) return null;
    if (isImage(m.attachment_url)) {
      return (
        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="block mt-1">
          <img
            src={m.attachment_url}
            alt={m.attachment_name || "image"}
            className="max-h-48 rounded-lg border border-slate-200 object-cover"
          />
        </a>
      );
    }
    return (
      <a
        href={m.attachment_url}
        target="_blank"
        rel="noreferrer"
        download={m.attachment_name || true}
        className={`flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg text-sm underline ${
          mine ? "bg-amber-600/40 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        <FileText size={15} />
        <span className="truncate max-w-[220px]">{m.attachment_name || "Attachment"}</span>
      </a>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <p className="text-slate-500 text-sm">Course group chat and direct messages.</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-red-50 border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

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
          {coursesLoaded && courses.length === 0
            ? (role === "student"
                ? "You are not enrolled in any course yet — enroll in a course first, then chat here."
                : "You have no courses yet — create a course first.")
            : "Select a course to start chatting."}
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
                const mine = Number(m.sender_id) === me;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-amber-500 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
                      {!mine && <p className="text-xs font-semibold text-slate-500 mb-0.5">{m.sender_name}</p>}
                      {m.text && <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>}
                      {renderAttachment(m, mine)}
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

          <div className="p-3 border-t border-slate-100 flex gap-2 items-center">
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={(e) => sendFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              title="Attach a file or image"
              className="text-slate-500 hover:text-amber-600 p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={uploading ? "Uploading attachment…" : "Type a message…"}
              disabled={uploading}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50"
            />
            <button onClick={send} disabled={uploading} className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-lg disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
