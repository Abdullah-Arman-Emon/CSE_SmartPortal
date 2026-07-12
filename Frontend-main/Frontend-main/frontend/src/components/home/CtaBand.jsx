import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "../motion/Reveal";

/** Closing call-to-action band — admin key `home_cta`. */
export default function CtaBand({ content }) {
  if (!content?.title) return null;

  return (
    <section className="mesh-bg relative overflow-hidden py-20 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px]" />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="mx-auto mt-4 max-w-xl text-slate-300">{content.subtitle}</p>
        )}
        {content.button?.label && (
          <Link
            to={content.button.href || "/apply"}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-base font-semibold text-slate-900 shadow-xl shadow-amber-500/25 transition hover:bg-amber-400"
          >
            {content.button.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </Reveal>
    </section>
  );
}
