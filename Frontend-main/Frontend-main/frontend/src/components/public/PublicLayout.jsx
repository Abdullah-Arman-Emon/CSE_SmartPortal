import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import Chatbot from "../Chatbot";
import { PublicSiteProvider } from "./PublicSiteContext";
import { pageTransition } from "../motion/motion";
import { hasDarkHero } from "./publicRoutes";

/**
 * Layout route for all public/guest pages: shared navbar + footer,
 * scroll-to-top on navigation, and a subtle cross-page fade transition.
 */
export default function PublicLayout() {
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <PublicSiteProvider>
      <div className="flex min-h-screen flex-col bg-slate-50">
        <PublicNavbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className={`flex-1 ${hasDarkHero(location.pathname) ? "" : "pt-16"}`}
            {...(reduce ? {} : pageTransition)}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <PublicFooter />
        <Chatbot />
      </div>
    </PublicSiteProvider>
  );
}
