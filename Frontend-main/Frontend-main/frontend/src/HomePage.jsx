import { useEffect, useState } from "react";
import axios from "axios";

import Hero from "./components/home/Hero";
import Ticker from "./components/home/Ticker";
import Stats from "./components/home/Stats";
import WhyCsedu from "./components/home/WhyCsedu";
import Research from "./components/home/Research";
import News from "./components/home/News";
import ProgramsPreview from "./components/home/ProgramsPreview";
import Events from "./components/home/Events";
import Achievements from "./components/home/Achievements";
import FacultySpotlight from "./components/home/FacultySpotlight";
import Testimonials from "./components/home/Testimonials";
import Partners from "./components/home/Partners";
import CampusLife from "./components/home/CampusLife";
import Faq from "./components/home/Faq";
import CtaBand from "./components/home/CtaBand";
import { parseContent } from "./components/public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Admin-managed site_content keys this page renders
const HOME_KEYS = [
  "home_hero",
  "home_highlights",
  "about_text",
  "research_showcase",
  "achievements_showcase",
  "testimonials",
  "partners",
  "faqs",
  "home_cta",
  "home_featured_people",
  "dept_stats",
  "campus_life_text",
  "campus_life_video",
  "campus_life_caption_title",
  "campus_life_caption_sub",
].join(",");

const HomePage = () => {
  const [content, setContent] = useState({});

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/content`, { params: { keys: HOME_KEYS } })
      .then((res) => setContent(res.data || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-slate-50">
      <Hero content={parseContent(content.home_hero, null)} />
      <Stats deptStats={parseContent(content.dept_stats, [])} />
      <Ticker />
      <WhyCsedu
        aboutText={content.about_text}
        highlights={parseContent(content.home_highlights, [])}
      />
      <Research showcase={parseContent(content.research_showcase, [])} />
      <News />
      <ProgramsPreview />
      <Events />
      <Achievements showcase={parseContent(content.achievements_showcase, [])} />
      <FacultySpotlight featuredIds={parseContent(content.home_featured_people, [])} />
      <Testimonials items={parseContent(content.testimonials, [])} />
      <Partners items={parseContent(content.partners, [])} />
      <CampusLife content={content} />
      <Faq items={parseContent(content.faqs, [])} />
      <CtaBand content={parseContent(content.home_cta, null)} />
    </div>
  );
};

export default HomePage;
