import { useEffect, useState } from "react";
import axios from "axios";
import { motion, useReducedMotion } from "framer-motion";
import {
  Award,
  BookOpen,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Quote,
  Users,
} from "lucide-react";
import PageHero from "../components/public/PageHero";
import SectionHeading from "../components/public/SectionHeading";
import Reveal from "../components/motion/Reveal";
import AnimatedCounter from "../components/public/AnimatedCounter";
import { parseContent, resourceUrl } from "../components/public/content";
import { slideLeft, slideRight, viewportOnce, EASE } from "../components/motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const STAT_ICONS = [Users, GraduationCap, BookOpen];

const AboutChairman = () => {
  const reduce = useReducedMotion();
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/content`)
      .then((res) => {
        setContent(res.data || {});
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load page content. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const researchAreas = parseContent(content.research_areas, []);
  const achievements = parseContent(content.achievements, []);
  const deptStats = parseContent(content.dept_stats, []);
  const officeHours = parseContent(content.office_hours, []);
  const timeline = parseContent(content.history_timeline, []);

  const paragraphs = (text) =>
    (text || "")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="About"
        title="Department of Computer Science & Engineering"
        sub="University of Dhaka — fostering quality education and research in computing since 1992."
        crumbs={[{ label: "About the Department" }]}
        stats={deptStats.slice(0, 3).map((s) => ({ value: s.value, label: s.label }))}
      />

      {loading && <div className="py-20 text-center text-slate-500">Loading…</div>}
      {loadError && <div className="py-20 text-center text-red-600">{loadError}</div>}

      {!loading && !loadError && (
        <>
          {/* Chairman message */}
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="grid items-start gap-12 lg:grid-cols-5">
              <Reveal variant={slideLeft} className="lg:col-span-2">
                <div className="relative mx-auto max-w-sm">
                  <motion.div
                    className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/25 to-accent-400/25 blur-xl"
                    animate={reduce ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {content.chairman_photo ? (
                    <img
                      src={resourceUrl(content.chairman_photo)}
                      alt="Chairman"
                      className="relative w-full rounded-[2rem] object-cover shadow-2xl"
                    />
                  ) : (
                    <div className="mesh-bg relative flex aspect-[4/5] w-full items-center justify-center rounded-[2rem] text-cyan-300 shadow-2xl">
                      <Users className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow-lg">
                    Message from the Chairman
                  </div>
                </div>
              </Reveal>
              <Reveal variant={slideRight} className="lg:col-span-3">
                <Quote className="h-10 w-10 text-brand-400" />
                <div className="mt-4 space-y-5">
                  {paragraphs(content.chairman_message)
                    .slice(0, 3)
                    .map((p, i) => (
                      <p key={i} className="text-base leading-relaxed text-slate-600 md:text-lg">
                        {p}
                      </p>
                    ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* History timeline */}
          {(timeline.length > 0 || content.history_text) && (
            <section className="mesh-bg py-24 text-white">
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <SectionHeading
                  eyebrow="Our Story"
                  title="Three decades of firsts"
                  dark
                />
                {timeline.length > 0 ? (
                  <div className="relative mt-16">
                    <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-cyan-400/60 via-brand-500/40 to-transparent md:left-1/2" />
                    <div className="space-y-12">
                      {timeline.map((t, i) => {
                        const left = i % 2 === 0;
                        return (
                          <motion.div
                            key={i}
                            initial={reduce ? false : { opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={viewportOnce}
                            transition={{ duration: 0.55, ease: EASE }}
                            className={`relative pl-12 md:w-1/2 md:pl-0 ${
                              left ? "md:pr-12 md:text-right" : "md:ml-auto md:pl-12"
                            }`}
                          >
                            <span
                              className={`absolute left-4 top-1.5 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20 md:left-auto ${
                                left ? "md:right-0 md:translate-x-1/2" : "md:left-0 md:-translate-x-1/2"
                              }`}
                            />
                            <span className="font-display text-sm font-bold text-cyan-300">
                              {t.year}
                            </span>
                            <h3 className="font-display mt-1 text-lg font-semibold">{t.title}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                              {t.description}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 space-y-4">
                    {paragraphs(content.history_text)
                      .slice(0, 4)
                      .map((p, i) => (
                        <p key={i} className="leading-relaxed text-slate-300">
                          {p}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* About + Mission */}
          <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              <Reveal>
                <SectionHeading eyebrow="Who We Are" title="About the department" align="left" />
                <div className="mt-6 space-y-4">
                  {paragraphs(content.about_text)
                    .slice(0, 2)
                    .map((p, i) => (
                      <p key={i} className="leading-relaxed text-slate-600">
                        {p}
                      </p>
                    ))}
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <SectionHeading eyebrow="Our Purpose" title="Mission & values" align="left" />
                <div className="mt-6 space-y-4">
                  {paragraphs(content.mission_text)
                    .slice(0, 2)
                    .map((p, i) => (
                      <p key={i} className="leading-relaxed text-slate-600">
                        {p}
                      </p>
                    ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* Research + achievements + sidebar cards */}
          <section className="bg-white py-20">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3">
              {(researchAreas.length > 0 || achievements.length > 0) && (
                <Reveal className="lg:col-span-2">
                  <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-8">
                    <h3 className="font-display flex items-center gap-2.5 text-xl font-bold text-slate-900">
                      <Award className="h-5 w-5 text-brand-600" />
                      Research & Achievements
                    </h3>
                    <div className="mt-6 grid gap-8 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                          Research Areas
                        </h4>
                        <ul className="mt-3 space-y-2.5">
                          {researchAreas.map((r, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                          Key Achievements
                        </h4>
                        <ul className="mt-3 space-y-2.5">
                          {achievements.map((a, i) => (
                            <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              <div className="space-y-6">
                {/* Contact */}
                <Reveal delay={0.05}>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="font-display font-bold text-slate-900">Contact Information</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      {content.contact_email && (
                        <p className="flex items-center gap-2.5">
                          <Mail className="h-4 w-4 text-brand-500" /> {content.contact_email}
                        </p>
                      )}
                      {content.contact_phone && (
                        <p className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 text-brand-500" /> {content.contact_phone}
                        </p>
                      )}
                      {content.contact_address && (
                        <p className="flex items-center gap-2.5">
                          <MapPin className="h-4 w-4 text-brand-500" /> {content.contact_address}
                        </p>
                      )}
                      {content.contact_hours && (
                        <p className="flex items-center gap-2.5">
                          <Calendar className="h-4 w-4 text-brand-500" /> {content.contact_hours}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>

                {/* Stats */}
                {deptStats.length > 0 && (
                  <Reveal delay={0.1}>
                    <div className="mesh-bg-soft rounded-3xl p-6 text-white">
                      <h3 className="font-display font-bold">Department at a Glance</h3>
                      <div className="mt-4 space-y-4">
                        {deptStats.map((s, i) => {
                          const Icon = STAT_ICONS[i % STAT_ICONS.length];
                          return (
                            <div key={i} className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm text-slate-300">
                                <Icon className="h-4 w-4 text-cyan-400" /> {s.label}
                              </span>
                              <span className="font-display font-bold">
                                <AnimatedCounter value={s.value} />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Reveal>
                )}

                {/* Office hours */}
                {officeHours.length > 0 && (
                  <Reveal delay={0.15}>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                      <h3 className="font-display font-bold text-slate-900">Office Hours</h3>
                      <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                        {officeHours.map((o, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{o.days}</span>
                            <span className="font-medium text-slate-800">{o.time}</span>
                          </div>
                        ))}
                        {content.office_hours_note && (
                          <p className="pt-2 text-xs text-slate-400">{content.office_hours_note}</p>
                        )}
                      </div>
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </section>

          {/* Connect band */}
          {content.connect_text && (
            <section className="mesh-bg py-20 text-white">
              <Reveal className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                <h2 className="font-display text-3xl font-bold">
                  {content.connect_heading || "Connect With Us"}
                </h2>
                <p className="mt-5 leading-relaxed text-slate-300">{content.connect_text}</p>
              </Reveal>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AboutChairman;
