import { MoreHorizontal } from "lucide-react";

/**
 * Android-style fixed bottom navigation, mobile only (hidden on lg+).
 * Shows up to 4 primary destinations + a "More" button that opens the full menu.
 *
 *   items: [{ key, label, Icon, active:boolean, onClick }]
 *   onMore: () => void   // opens the side drawer with every destination
 */
export default function BottomNav({ items = [], onMore, moreActive = false }) {
  const cell =
    "flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 min-w-0 transition-colors";
  const label = "text-[10px] leading-none font-medium truncate max-w-[64px]";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200
                 flex items-stretch shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      {items.slice(0, 4).map(({ key, label: text, Icon, active, onClick }) => (
        <button
          key={key}
          onClick={onClick}
          className={`${cell} ${active ? "text-orange-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          <span className={active ? "relative" : ""}>
            <Icon size={22} className="shrink-0" />
            {active && (
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-orange-500" />
            )}
          </span>
          <span className={label}>{text}</span>
        </button>
      ))}
      {onMore && (
        <button
          onClick={onMore}
          className={`${cell} ${moreActive ? "text-orange-600" : "text-slate-500 hover:text-slate-700"}`}
        >
          <MoreHorizontal size={22} />
          <span className={label}>More</span>
        </button>
      )}
    </nav>
  );
}
