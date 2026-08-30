import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Radio, Users2, MapPin, TrendingUp, Vote } from "lucide-react";

type FeedItem = {
  id: string;
  icon: React.ReactNode;
  eyebrow: string;
  headline: string;
  meta: string;
};

const BASE_FEED: Record<string, FeedItem[]> = {
  AP: [
    { id: "ap-1", icon: <ShieldCheck className="w-4 h-4" />, eyebrow: "Verified", headline: "Kadapa AC voter rolls refreshed to 2.85L", meta: "ECI · 2 min ago" },
    { id: "ap-2", icon: <Radio className="w-4 h-4" />,       eyebrow: "Live",     headline: "Candidate A YouTube subscribers cross 44K",   meta: "Google · 6 min ago" },
    { id: "ap-3", icon: <Vote className="w-4 h-4" />,        eyebrow: "Verified", headline: "3 nominations filed in Kamalapuram AC",      meta: "ECI · 14 min ago" },
    { id: "ap-4", icon: <TrendingUp className="w-4 h-4" />,  eyebrow: "Derived",  headline: "+3.2% engagement lift on Water Supply theme", meta: "NLP · 21 min ago" },
    { id: "ap-5", icon: <Users2 className="w-4 h-4" />,      eyebrow: "Live",     headline: "Central Bazaar squad hits 20.1K households",  meta: "Field · 34 min ago" },
    { id: "ap-6", icon: <MapPin className="w-4 h-4" />,      eyebrow: "Estimated",headline: "Pulivendula digital audience revised to 4.10L", meta: "Meta · 42 min ago" },
  ],
  TS: [
    { id: "ts-1", icon: <ShieldCheck className="w-4 h-4" />, eyebrow: "Verified", headline: "Hyderabad-East rolls refreshed to 3.12L",    meta: "ECI · 4 min ago" },
    { id: "ts-2", icon: <Radio className="w-4 h-4" />,       eyebrow: "Live",     headline: "Warangal candidate handles re-verified",     meta: "Meta · 9 min ago" },
    { id: "ts-3", icon: <TrendingUp className="w-4 h-4" />,  eyebrow: "Derived",  headline: "+2.7% youth engagement on Employment theme", meta: "NLP · 18 min ago" },
    { id: "ts-4", icon: <Users2 className="w-4 h-4" />,      eyebrow: "Live",     headline: "Karimnagar squad activated · 96 members",    meta: "Field · 29 min ago" },
  ],
  KA: [
    { id: "ka-1", icon: <ShieldCheck className="w-4 h-4" />, eyebrow: "Verified", headline: "Bengaluru-South rolls closed at 4.02L",       meta: "ECI · 3 min ago" },
    { id: "ka-2", icon: <Radio className="w-4 h-4" />,       eyebrow: "Live",     headline: "Mysuru candidate Instagram audience +8.4%",   meta: "Meta · 11 min ago" },
    { id: "ka-3", icon: <Vote className="w-4 h-4" />,        eyebrow: "Verified", headline: "5 new AC candidate profiles indexed",         meta: "ECI · 22 min ago" },
    { id: "ka-4", icon: <TrendingUp className="w-4 h-4" />,  eyebrow: "Derived",  headline: "Public Transit theme rising in Hubli",        meta: "NLP · 33 min ago" },
  ],
  TN: [
    { id: "tn-1", icon: <ShieldCheck className="w-4 h-4" />, eyebrow: "Verified", headline: "Chennai-North rolls updated to 3.68L",         meta: "ECI · 5 min ago" },
    { id: "tn-2", icon: <Radio className="w-4 h-4" />,       eyebrow: "Live",     headline: "Coimbatore candidate reach up 12% MoM",        meta: "Google · 12 min ago" },
    { id: "tn-3", icon: <TrendingUp className="w-4 h-4" />,  eyebrow: "Derived",  headline: "+4.1% sentiment on Water Supply agenda",       meta: "NLP · 24 min ago" },
    { id: "tn-4", icon: <Users2 className="w-4 h-4" />,      eyebrow: "Live",     headline: "Madurai volunteer amplification hits 91%",      meta: "Field · 38 min ago" },
  ],
};

const tone = (level: string) => {
  switch (level) {
    case "Verified": return { fg: "text-emerald-300", dot: "bg-emerald-400" };
    case "Live":     return { fg: "text-emerald-300", dot: "bg-emerald-400" };
    case "Estimated":return { fg: "gold-text",        dot: "bg-[#D4A24C]" };
    case "Derived":  return { fg: "text-[#E9C77A]",   dot: "bg-[#B45309]" };
    default:         return { fg: "text-[#B9AF95]",   dot: "bg-[#6C707D]" };
  }
};

export const VerifiedFeed: React.FC<{ stateId: string; stateName?: string }> = ({ stateId, stateName = "State" }) => {
  const items = useMemo(() => {
    if (BASE_FEED[stateId]) return BASE_FEED[stateId];
    return [
      { id: `${stateId}-1`, icon: <ShieldCheck className="w-4 h-4" />, eyebrow: "Verified", headline: `${stateName} AC electoral rolls verified with ECI`, meta: "ECI · 2 min ago" },
      { id: `${stateId}-2`, icon: <Radio className="w-4 h-4" />,       eyebrow: "Live",     headline: `Candidate social handles and feeds synchronized`, meta: "Google · 8 min ago" },
      { id: `${stateId}-3`, icon: <Vote className="w-4 h-4" />,        eyebrow: "Verified", headline: `Delimited AC boundaries and booth clusters indexed`, meta: "ECI · 16 min ago" },
      { id: `${stateId}-4`, icon: <TrendingUp className="w-4 h-4" />,  eyebrow: "Derived",  headline: `Citizen sentiment graph active across ${stateName} ACs`, meta: "NLP · 27 min ago" },
      { id: `${stateId}-5`, icon: <Users2 className="w-4 h-4" />,      eyebrow: "Live",     headline: `Constituency volunteer relay squads online`, meta: "Field · 35 min ago" }
    ];
  }, [stateId, stateName]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx((v) => (v + 1) % items.length), 3400);
    return () => clearInterval(t);
  }, [items]);

  // Window of 3 items rotating around idx
  const windowItems = [items[idx % items.length], items[(idx + 1) % items.length], items[(idx + 2) % items.length]];

  return (
    <div
      data-testid="verified-feed"
      className="rounded-xl border border-[#D4A24C]/25 bg-[#0F2338]/70 backdrop-blur px-4 pt-3 pb-2 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
          </span>
          <span className="eyebrow gold-text">Verified feed</span>
        </div>
        <span className="text-[10px] text-[#8A8E9B] font-mono-data tabular">
          {String(idx + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}
        </span>
      </div>

      <ul className="divide-y divide-[#22405E]/60">
        {windowItems.map((it, i) => {
          const t = tone(it.eyebrow);
          return (
            <li
              key={`${it.id}-${idx}-${i}`}
              className={`flex items-start gap-3 py-2 ${i === 0 ? "animate-rise" : "opacity-70"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="w-7 h-7 shrink-0 rounded-md bg-[#0B1A2C] border border-[#22405E] inline-flex items-center justify-center text-[#D4A24C]">
                {it.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} aria-hidden />
                  <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${t.fg}`}>
                    {it.eyebrow}
                  </span>
                  <span className="text-[10px] text-[#8A8E9B]">· {it.meta}</span>
                </div>
                <div className="text-[13px] cream-text mt-0.5 truncate">
                  {it.headline}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
