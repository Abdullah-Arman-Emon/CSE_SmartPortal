// Global toast — imperative, no hook plumbing required.
// Call `toast.success("Saved")` / `toast.error(...)` / `toast.info(...)` from
// anywhere, and mount <Toaster/> once at the app root.
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

let _id = 0;
const listeners = new Set();
const emit = (type, message, opts = {}) => {
  const t = { id: ++_id, type, message: String(message ?? ""), duration: opts.duration ?? 3800 };
  listeners.forEach((fn) => fn(t));
  return t.id;
};

export const toast = {
  success: (m, o) => emit("success", m, o),
  error: (m, o) => emit("error", m, o),
  info: (m, o) => emit("info", m, o),
};

const META = {
  success: { Icon: CheckCircle2, ring: "border-emerald-200", dot: "text-emerald-500", bar: "bg-emerald-500" },
  error: { Icon: AlertCircle, ring: "border-rose-200", dot: "text-rose-500", bar: "bg-rose-500" },
  info: { Icon: Info, ring: "border-brand-300", dot: "text-brand-600", bar: "bg-brand-500" },
};

function Toast({ t, onClose }) {
  const [leaving, setLeaving] = useState(false);
  const { Icon, ring, dot, bar } = META[t.type] || META.info;

  useEffect(() => {
    const close = setTimeout(() => setLeaving(true), t.duration);
    const rm = setTimeout(onClose, t.duration + 220);
    return () => { clearTimeout(close); clearTimeout(rm); };
  }, [t.duration, onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex items-start gap-3 w-80 max-w-[90vw] overflow-hidden rounded-xl border ${ring} bg-white shadow-lg shadow-slate-900/10 pl-4 pr-3 py-3 transition-all duration-200 ${
        leaving ? "opacity-0 translate-x-3" : "opacity-100 translate-x-0"
      }`}
      style={{ animation: leaving ? undefined : "toast-in .22s cubic-bezier(.2,.9,.3,1)" }}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${bar}`} />
      <Icon size={18} className={`${dot} shrink-0 mt-0.5`} />
      <p className="text-sm text-slate-700 flex-1 leading-snug">{t.message}</p>
      <button onClick={() => setLeaving(true)} className="text-slate-400 hover:text-slate-600 shrink-0 -mr-1 p-0.5">
        <X size={15} />
      </button>
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const add = (t) => setItems((prev) => [...prev, t]);
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);
  const remove = (id) => setItems((prev) => prev.filter((x) => x.id !== id));

  return (
    <div className="fixed z-[100] top-4 right-4 flex flex-col gap-2 pointer-events-none">
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateX(16px) scale(.98)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){[role="status"]{animation:none!important;transition:none!important}}`}</style>
      {items.map((t) => (
        <Toast key={t.id} t={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}

export default Toaster;
