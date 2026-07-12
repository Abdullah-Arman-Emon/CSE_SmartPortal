import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Site-wide admin-managed content shared by the public chrome
// (footer, ticker, social links). Pages fetch their own page-specific keys.
const LAYOUT_KEYS = [
  "footer_about",
  "social_links",
  "contact_email",
  "contact_phone",
  "contact_address",
  "contact_hours",
  "announcement_ticker",
  "department_info",
].join(",");

const PublicSiteContext = createContext({ content: {}, loading: true });

export function PublicSiteProvider({ children }) {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/guest/site/content`, { params: { keys: LAYOUT_KEYS } })
      .then((res) => {
        if (!cancelled) setContent(res.data || {});
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicSiteContext.Provider value={{ content, loading }}>
      {children}
    </PublicSiteContext.Provider>
  );
}

export function usePublicSite() {
  return useContext(PublicSiteContext);
}
