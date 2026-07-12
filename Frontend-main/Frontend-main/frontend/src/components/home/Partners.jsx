import Marquee from "../public/Marquee";
import { resourceUrl } from "../public/content";

/** Industry & placement partners — logo/name marquee from admin key `partners`. */
export default function Partners({ items }) {
  const partners = Array.isArray(items) ? items : [];
  if (partners.length === 0) return null;

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Our graduates work at
      </p>
      <div className="mt-8">
        <Marquee duration={28}>
          {partners.map((p, i) => {
            const inner = p.logo_url ? (
              <img
                src={resourceUrl(p.logo_url)}
                alt={p.name}
                className="h-9 w-auto opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span className="font-display whitespace-nowrap text-xl font-bold text-slate-400 transition hover:text-slate-600">
                {p.name}
              </span>
            );
            return p.href ? (
              <a key={i} href={p.href} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <span key={i}>{inner}</span>
            );
          })}
        </Marquee>
      </div>
    </section>
  );
}
