import { useEffect, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "../public/SectionHeading";
import Reveal from "../motion/Reveal";
import { resourceUrl } from "../public/content";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/** Gallery carousel + campus-life video (admin gallery table + campus_life_* keys). */
export default function CampusLife({ content }) {
  const reduce = useReducedMotion();
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/guest/site/gallery`)
      .then((res) => setImages((res.data || []).filter((g) => g.is_active !== false)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduce || images.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 5000);
    return () => clearInterval(t);
  }, [images.length, reduce]);

  const video = content?.campus_life_video;
  if (images.length === 0 && !video) return null;

  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Campus Life"
          title="Life at CSEDU"
          sub={content?.campus_life_text}
        />
        <div className="mt-14 grid items-stretch gap-8 lg:grid-cols-2">
          {/* Gallery carousel */}
          {images.length > 0 && (
            <Reveal className="relative min-h-[20rem] overflow-hidden rounded-3xl shadow-xl">
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={index}
                  src={resourceUrl(images[index % images.length].image_url)}
                  alt={images[index % images.length].caption || "Campus"}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={reduce ? false : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </AnimatePresence>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050B1F]/85 to-transparent p-5 pt-14">
                {images[index % images.length].caption && (
                  <p className="text-sm font-medium text-white">
                    {images[index % images.length].caption}
                  </p>
                )}
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setIndex((i) => (i + 1) % images.length)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow backdrop-blur hover:bg-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 right-4 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Image ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          i === index ? "w-5 bg-cyan-400" : "w-1.5 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </Reveal>
          )}

          {/* Video */}
          {video && (
            <Reveal className="relative min-h-[20rem] overflow-hidden rounded-3xl shadow-xl" delay={0.1}>
              <video
                src={resourceUrl(video)}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay={!reduce}
                muted
                loop
                playsInline
                controls={reduce}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#050B1F]/85 to-transparent p-5 pt-14">
                {content?.campus_life_caption_title && (
                  <p className="font-display font-semibold text-white">
                    {content.campus_life_caption_title}
                  </p>
                )}
                {content?.campus_life_caption_sub && (
                  <p className="text-sm text-slate-300">{content.campus_life_caption_sub}</p>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
