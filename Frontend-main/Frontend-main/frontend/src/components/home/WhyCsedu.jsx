import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../motion/Reveal";
import SectionHeading from "../public/SectionHeading";
import { slideLeft, slideRight } from "../motion/motion";
import { getIcon } from "../public/iconMap";

/** "Why CSEDU" split section — `about_text` + `home_highlights` keys. */
export default function WhyCsedu({ aboutText, highlights }) {
  const items = Array.isArray(highlights) ? highlights : [];
  const intro = (aboutText || "").split("\n")[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <SectionHeading
        eyebrow="Why CSEDU"
        title="The strongest computing department in the region"
        align="left"
      />
      <div className="mt-12 grid items-start gap-12 lg:grid-cols-2">
        <Reveal variant={slideLeft}>
          <p className="text-lg leading-relaxed text-slate-600">{intro}</p>
          <Link
            to="/chairman"
            className="group mt-6 inline-flex items-center gap-2 font-semibold text-brand-600 hover:text-brand-700"
          >
            Learn more about the department
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
        <div className="space-y-5">
          {items.map((h, i) => {
            const Icon = getIcon(h.icon);
            return (
              <Reveal key={i} variant={slideRight} delay={i * 0.08}>
                <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">{h.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{h.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
