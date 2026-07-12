/**
 * CSS-keyframe infinite marquee. Content is duplicated so the -50% keyframe
 * loops seamlessly. Pauses on hover; disabled entirely under reduced motion
 * (falls back to a scrollable row).
 */
export default function Marquee({ children, duration = 30, className = "" }) {
  return (
    <div className={`group/marquee marquee-mask overflow-hidden ${className}`}>
      <div
        className="animate-marquee flex w-max items-center gap-10 motion-reduce:animate-none motion-reduce:w-full motion-reduce:overflow-x-auto"
        style={{ "--marquee-duration": `${duration}s` }}
      >
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
