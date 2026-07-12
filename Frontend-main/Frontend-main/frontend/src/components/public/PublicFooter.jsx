import { Link } from "react-router-dom";
import {
  Facebook,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  Clock,
} from "lucide-react";
import { usePublicSite } from "./PublicSiteContext";
import { parseContent } from "./content";

const QUICK_LINKS = [
  { to: "/people", label: "People Directory" },
  { to: "/chairman", label: "About the Department" },
  { to: "/admission-hub", label: "Admission Hub" },
  { to: "/apply", label: "Apply Now" },
  { to: "/notice-board", label: "Notice Board" },
  { to: "/meetings", label: "Departmental Meetings" },
];

const SOCIAL_ICONS = {
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  x: Twitter,
  twitter: Twitter,
};

export default function PublicFooter() {
  const { content } = usePublicSite();
  const about =
    content.footer_about ||
    "Department of Computer Science and Engineering, University of Dhaka — advancing computing education and research in Bangladesh since 1992.";
  const socials = parseContent(content.social_links, {});

  return (
    <footer className="mesh-bg-soft mt-auto text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* About */}
        <div>
          <Link to="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">
              CSE<span className="text-aurora">DU</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{about}</p>
          <div className="mt-5 flex gap-2">
            {Object.entries(SOCIAL_ICONS).map(([key, Icon]) => {
              const href = socials?.[key];
              if (!href) return null;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={key}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 hover:border-cyan-400/40 hover:text-cyan-300"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-white">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-slate-400 hover:text-cyan-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {content.contact_address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span>{content.contact_address}</span>
              </li>
            )}
            {content.contact_email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <a href={`mailto:${content.contact_email}`} className="hover:text-cyan-300">
                  {content.contact_email}
                </a>
              </li>
            )}
            {content.contact_phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span>{content.contact_phone}</span>
              </li>
            )}
            {content.contact_hours && (
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span>{content.contact_hours}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Portal */}
        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-white">
            SmartPortal
          </h3>
          <p className="mt-4 text-sm text-slate-400">
            Students, teachers and staff — sign in to access courses, results, finance and more.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              to="/apply"
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} Department of CSE, University of Dhaka. All rights
            reserved.
          </span>
          <span>Built by Team LogicLoop</span>
        </div>
      </div>
    </footer>
  );
}
