import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import Marquee from "../public/Marquee";
import { usePublicSite } from "../public/PublicSiteContext";
import { parseContent } from "../public/content";

/** Thin announcement marquee under the hero — admin key `announcement_ticker`. */
export default function Ticker() {
  const { content } = usePublicSite();
  const ticker = parseContent(content.announcement_ticker, null);

  if (!ticker?.enabled || !ticker.items?.length) return null;

  return (
    <div className="border-y border-white/10 bg-[#081431] py-2.5 text-sm text-cyan-100">
      <Marquee duration={40}>
        {ticker.items.map((item, i) => {
          const inner = (
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <Megaphone className="h-3.5 w-3.5 text-cyan-400" />
              {item.text}
            </span>
          );
          return item.href ? (
            <Link key={i} to={item.href} className="hover:text-white">
              {inner}
            </Link>
          ) : (
            <span key={i}>{inner}</span>
          );
        })}
      </Marquee>
    </div>
  );
}
