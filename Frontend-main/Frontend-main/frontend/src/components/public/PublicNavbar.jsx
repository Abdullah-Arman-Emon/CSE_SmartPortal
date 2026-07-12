import { useContext, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GraduationCap, Menu, X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { hasDarkHero } from "./publicRoutes";

const NAV_ITEMS = [
  { to: "/people", label: "People" },
  { to: "/chairman", label: "About" },
  { to: "/admission-hub", label: "Admissions" },
  { to: "/notice-board", label: "Notices" },
  { to: "/meetings", label: "Meetings" },
];

export default function PublicNavbar() {
  const { user, setUser, setToken } = useContext(AuthContext);
  const isLoggedIn = user?.isAuthenticated || false;
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Transparent-over-hero only on pages that open with a dark mesh hero.
  const solid = scrolled || mobileOpen || !hasDarkHero(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goDashboard = () => {
    if (user?.role === "student") navigate("/student-dashboard");
    else if (user?.role === "teacher") navigate("/teacher-dashboard");
    else if (user?.role === "admin") navigate("/admin-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setMobileOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-white/10 bg-[#050B1F]/85 shadow-lg shadow-black/20 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="group flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-bold tracking-tight sm:text-lg">
            CSE<span className="text-aurora">DU</span>
            <span className="ml-2 hidden text-xs font-medium text-slate-400 lg:inline">
              University of Dhaka
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="relative px-3 py-2 text-sm">
              {({ isActive }) => (
                <>
                  <span
                    className={`transition-colors ${
                      isActive ? "font-semibold text-cyan-300" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId={reduce ? undefined : "nav-underline"}
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-cyan-400"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/apply"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/25 hover:bg-amber-400"
          >
            Apply Now
          </Link>
          {isLoggedIn ? (
            <>
              <button
                onClick={goDashboard}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white md:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-white/10 bg-[#050B1F]/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-base font-medium ${
                      isActive ? "bg-white/10 text-cyan-300" : "text-slate-200 hover:bg-white/5"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/apply"
                onClick={() => setMobileOpen(false)}
                className="mt-2 block rounded-lg bg-amber-500 px-3 py-2.5 text-center text-base font-semibold text-slate-900"
              >
                Apply Now
              </Link>
              <div className="mt-3 border-t border-white/10 pt-3">
                {isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="px-3 text-sm text-slate-400">
                      {user.fullname} · {user.email}
                    </div>
                    <button
                      onClick={() => {
                        goDashboard();
                        setMobileOpen(false);
                      }}
                      className="block w-full rounded-lg border border-white/15 px-3 py-2.5 text-left text-base font-medium text-white"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-base font-medium text-red-400"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg border border-white/15 px-3 py-2.5 text-center text-base font-medium text-white"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg bg-white/10 px-3 py-2.5 text-center text-base font-medium text-white"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
