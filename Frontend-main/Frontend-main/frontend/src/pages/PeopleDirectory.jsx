import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";
import PageHero from "../components/public/PageHero";
import { resourceUrl } from "../components/public/content";
import { springSoft } from "../components/motion/motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORY_TABS = ["All", "Faculty", "Officer", "Staff"];

function PersonAvatar({ person, className }) {
  if (person.image) {
    return (
      <img
        src={resourceUrl(person.image)}
        alt={person.name}
        loading="lazy"
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <span className={`${className} flex items-center justify-center bg-slate-100 text-slate-300`}>
      <UserRound className="h-1/2 w-1/2" />
    </span>
  );
}

const PeopleDirectory = () => {
  const reduce = useReducedMotion();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/people`)
      .then((res) => {
        setPeople(res.data || []);
        setLoadError(null);
      })
      .catch(() => setLoadError("Could not load the people directory. Please try again later."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return people.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        (p.expertise || []).some((e) => e.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [people, searchTerm, category]);

  const facultyCount = people.filter((p) => p.category === "Faculty").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="People"
        title="Faculty, Officers & Staff"
        sub="The minds behind three decades of computing excellence at the University of Dhaka."
        crumbs={[{ label: "People Directory" }]}
        stats={
          people.length > 0
            ? [
                { value: facultyCount, label: "Faculty" },
                { value: people.length, label: "Total Members" },
              ]
            : undefined
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 -mx-4 mb-10 border-b border-slate-200 bg-slate-50/90 px-4 py-4 backdrop-blur-lg sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setCategory(tab)}
                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      active ? "text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduce ? undefined : "people-tab"}
                        className="absolute inset-0 rounded-full bg-slate-900"
                        transition={springSoft}
                      />
                    )}
                    <span className="relative">{tab}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative md:w-80">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, role or expertise…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          {!loading && (
            <p className="mt-3 text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              {people.length} people
            </p>
          )}
        </div>

        {/* States */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        )}
        {loadError && <div className="py-16 text-center text-red-600">{loadError}</div>}

        {/* FLIP grid */}
        {!loading && !loadError && (
          <motion.div layout={!reduce} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((person) => (
                <motion.div
                  key={person.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <button
                    onClick={() => setSelectedPerson(person)}
                    className="group block h-full w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                  >
                    <div className="flex items-center gap-4">
                      <PersonAvatar
                        person={person}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display truncate font-semibold text-slate-900 group-hover:text-brand-600">
                          {person.name}
                        </h3>
                        <p className="truncate text-sm text-slate-500">{person.role}</p>
                        {person.status && (
                          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            {person.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {(person.expertise || []).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {person.expertise.slice(0, 3).map((exp) => (
                          <span
                            key={exp}
                            className="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-700"
                          >
                            {exp}
                          </span>
                        ))}
                        {person.expertise.length > 3 && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                            +{person.expertise.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                      {person.email && (
                        <p className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {person.email}
                        </p>
                      )}
                      {person.office && (
                        <p className="flex items-center gap-2 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {person.office}
                        </p>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && !loadError && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg text-slate-600">No people found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setCategory("All");
              }}
              className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Profile drawer */}
      <AnimatePresence>
        {selectedPerson && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-[#050B1F]/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
              initial={reduce ? { opacity: 0 } : { x: "100%" }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              role="dialog"
              aria-label={selectedPerson.name}
            >
              <div className="mesh-bg relative p-6 pb-10 text-white">
                <button
                  onClick={() => setSelectedPerson(null)}
                  aria-label="Close profile"
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex flex-wrap items-center gap-4 pt-6 pr-10">
                  <PersonAvatar
                    person={selectedPerson}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/20"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold sm:text-2xl">{selectedPerson.name}</h2>
                    <p className="text-slate-300">{selectedPerson.role}</p>
                    {selectedPerson.category && (
                      <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                        {selectedPerson.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative z-10 -mt-6 space-y-6 px-6 pb-10">
                {/* Contact card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Contact
                  </h3>
                  <div className="mt-3 space-y-2.5 text-sm text-slate-700">
                    {selectedPerson.email && (
                      <a
                        href={`mailto:${selectedPerson.email}`}
                        className="flex items-center gap-2.5 hover:text-brand-600"
                      >
                        <Mail className="h-4 w-4 text-brand-500" /> {selectedPerson.email}
                      </a>
                    )}
                    {selectedPerson.phone && (
                      <p className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 text-brand-500" /> {selectedPerson.phone}
                      </p>
                    )}
                    {selectedPerson.office && (
                      <p className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-brand-500" /> {selectedPerson.office}
                      </p>
                    )}
                    {selectedPerson.officeHours && (
                      <p className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-brand-500" /> {selectedPerson.officeHours}
                      </p>
                    )}
                  </div>
                </div>

                {selectedPerson.bio && (
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">Biography</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {selectedPerson.bio}
                    </p>
                  </div>
                )}

                {(selectedPerson.expertise || []).length > 0 && (
                  <div>
                    <h3 className="font-display font-semibold text-slate-900">
                      Areas of Expertise
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPerson.expertise.map((exp) => (
                        <span
                          key={exp}
                          className="rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-700"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedPerson.publications || []).length > 0 && (
                  <div>
                    <h3 className="font-display flex items-center gap-2 font-semibold text-slate-900">
                      <FileText className="h-4 w-4" /> Publications
                    </h3>
                    <div className="mt-3 space-y-3">
                      {selectedPerson.publications.map((pub, i) => (
                        <div key={i} className="rounded-xl border-l-4 border-brand-400 bg-slate-50 p-3.5">
                          <h4 className="text-sm font-medium text-slate-800">{pub.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            {pub.year && <span>{pub.year}</span>}
                            {pub.link && (
                              <a
                                href={pub.link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                              >
                                <ExternalLink className="h-3 w-3" /> View
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PeopleDirectory;
