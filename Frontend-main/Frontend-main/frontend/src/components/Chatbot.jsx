import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MessageCircle, Send, X, Bot, User, Sparkles, ArrowUpRight } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// AI runs server-side (backend holds the Gemini key + grounds answers in DB data),
// so no key is ever shipped to the browser.

const QUICK_QUESTIONS = [
  "What programs does CSEDU offer?",
  "How do I apply for admission?",
  "Tell me about the BSc curriculum",
  "Who are the faculty members?",
];

// Route the bot can deep-link to, chosen from the answer/question text.
function linkFor(text) {
  const t = text.toLowerCase();
  if (/(apply|application form)/.test(t)) return { to: "/apply", label: "Open application form" };
  if (/(admission|eligib|require|program|course|curriculum|syllab)/.test(t))
    return { to: "/admission-hub", label: "Explore programs & admission" };
  if (/(faculty|teacher|professor|staff|people|officer)/.test(t))
    return { to: "/people", label: "View people directory" };
  if (/(notice|announce|circular)/.test(t)) return { to: "/notice-board", label: "View notice board" };
  if (/(meeting|seminar|event)/.test(t)) return { to: "/meetings", label: "View meetings & events" };
  if (/(chair|about|history|department)/.test(t)) return { to: "/chairman", label: "About the department" };
  return null;
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Assalamu Alaikum! 👋 I'm the CSEDU Assistant for the Department of Computer Science & Engineering, University of Dhaka.\n\nAsk me anything about programs, admission, the curriculum, faculty, notices or campus life.",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 250);
  }, [isOpen]);

  const sendMessage = async (preset) => {
    const content = (preset ?? inputText).trim();
    if (!content || isLoading) return;
    const userMsg = { id: Date.now(), sender: "user", text: content, timestamp: new Date() };
    const history = messages
      .filter((m) => m.sender === "user" || m.sender === "bot")
      .slice(-8)
      .map((m) => ({ role: m.sender === "user" ? "user" : "model", text: m.text }));
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    try {
      let reply;
      try {
        // AI is served by our backend (key stays server-side, answers grounded in DB data).
        const res = await axios.post(`${BACKEND_URL}/v1/chatbot/ask`, {
          message: content,
          history,
        });
        reply = res.data?.reply;
      } catch {
        reply = null;
      }
      if (!reply) {
        reply =
          "I can't reach the assistant right now, but here's what I can tell you:\n\n" +
          "• CSEDU offers a 4-year BSc (Honours), MSc, MPhil and PhD in Computer Science & Engineering.\n" +
          "• Admission is merit-based through the University of Dhaka Science-unit exam.\n" +
          "• Use the Curriculum and Admission Hub pages, or Apply to start an application.\n\n" +
          "For exact fees and dates, please contact the department office.";
      }
      const link = linkFor(content + " " + reply);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "bot", text: reply, timestamp: new Date(), link },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goto = (to) => {
    setIsOpen(false);
    if (/^https?:\/\//.test(to)) window.open(to, "_blank", "noopener");
    else navigate(to);
  };

  const fmt = (t) => t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  // ---- Launcher (closed) ----
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open CSEDU Assistant"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-accent-500 px-4 py-3.5 text-white shadow-xl shadow-brand-600/30 transition hover:scale-105 sm:bottom-6 sm:right-6"
        style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden text-sm font-semibold sm:inline">Ask CSEDU</span>
      </button>
    );
  }

  // ---- Panel (open) ----
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl
                 h-[85dvh] rounded-t-2xl
                 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-label="CSEDU Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <Bot className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <h3 className="text-sm font-semibold">CSEDU Assistant</h3>
            <p className="flex items-center gap-1 text-[11px] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online · DU CSE
            </p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex max-w-[88%] items-start gap-2 ${
                m.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                  m.sender === "user" ? "bg-brand-600" : "bg-slate-700"
                }`}
              >
                {m.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </span>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.sender === "user"
                    ? "rounded-tr-sm bg-brand-600 text-white"
                    : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text.replace(/\*\*/g, "")}</p>
                {m.link && (
                  <button
                    onClick={() => goto(m.link.to)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand-500/10 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-500/20"
                  >
                    {m.link.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <p className={`mt-1 text-[10px] ${m.sender === "user" ? "text-white/70" : "text-slate-400"}`}>
                  {fmt(m.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.12s" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0.24s" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick questions (only before the user has asked anything) */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-white px-3 py-1.5 text-xs text-brand-700 hover:bg-brand-500/10"
              >
                <Sparkles className="h-3 w-3" /> {q}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-white p-2.5 sm:p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about programs, admission, faculty…"
            rows={1}
            disabled={isLoading}
            className="max-h-28 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:bg-slate-300"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">CSEDU Assistant · University of Dhaka</p>
      </div>
    </div>
  );
};

export default Chatbot;
