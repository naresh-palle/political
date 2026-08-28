import React, { useState, useEffect } from "react";
import { AuditReport } from "../../types";
import { formatLakhs, formatPercentage } from "../../calculations";
import { LeadersLogo } from "../common/LeadersLogo";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  TrendingUp,
  NotebookText,
} from "lucide-react";

interface PresentationModeProps {
  audit: AuditReport;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ audit, onExit }) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transition, setTransition] = useState<"in" | "out">("in");
  const [notesOpen, setNotesOpen] = useState<boolean>(true);

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) {
      setTransition("out");
      setTimeout(() => {
        setSlideIndex((prev) => prev + 1);
        setTransition("in");
      }, 220);
    }
  };
  const prevSlide = () => {
    if (slideIndex > 0) {
      setTransition("out");
      setTimeout(() => {
        setSlideIndex((prev) => prev - 1);
        setTransition("in");
      }, 220);
    }
  };
  const goToSlide = (idx: number) => {
    if (idx === slideIndex) return;
    setTransition("out");
    setTimeout(() => {
      setSlideIndex(idx);
      setTransition("in");
    }, 220);
  };

  const slides = [
    {
      id: "slide-cover",
      eyebrow: "Confidential briefing · Executive edition",
      title: (
        <>
          <span className="cream-text">{audit.assembly.name}</span>{" "}
          <span className="italic gold-text">strength,</span>{" "}
          <span className="cream-text">at a glance.</span>
        </>
      ),
      subtitle: `${audit.assembly.code} · ${audit.parliament.name} Parliamentary Constituency · ${audit.state.name}`,
      notes: [
        `Open the briefing by anchoring the room to ${audit.assembly.name} AC (${audit.assembly.code}).`,
        `Lead with the Social Strength score of ${audit.client.socialStrengthScore}/100 — this is our headline number.`,
        `Flag the reach gap of ${formatLakhs(audit.voterStats.voterReachGap, true)} early — it frames every recommendation later.`,
      ],
      render: () => (
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <BoardMetric label="Social strength" value={String(audit.client.socialStrengthScore)} suffix="/ 100" note={`Rank #1 of ${audit.candidates.length}`} tone="gold" />
          <BoardMetric label="Voter coverage" value={formatPercentage(audit.voterStats.voterCoveragePercentage)} note={`${formatLakhs(audit.voterStats.estimatedUniqueClientReach, true)} of ${formatLakhs(audit.voterStats.totalVoters, true)}`} />
          <BoardMetric label="Combined following" value={formatLakhs(audit.client.combinedFollowing, true)} note="Across 4 verified platforms" />
          <BoardMetric label="Reach gap" value={formatLakhs(audit.voterStats.voterReachGap, true)} note="Addressable opportunity" tone="saffron" />
        </div>
      ),
    },
    {
      id: "slide-headline",
      eyebrow: "The finding",
      title: <span className="cream-text">Dominant narrative</span>,
      subtitle: "Where the constituency stands right now",
      notes: [
        "Deliver the headline in one breath — this is the sound-bite.",
        "Then walk observation 01 → 02 → 03 without editorialising.",
        "Pause after observation 03; let the room absorb the reach gap.",
      ],
      render: () => (
        <div className="max-w-5xl mx-auto space-y-10">
          <blockquote className="font-display text-[42px] sm:text-[56px] lg:text-[68px] leading-[1.05] tracking-[-0.02em] cream-text">
            <span className="gold-text">“</span>
            {audit.headline}
            <span className="gold-text">”</span>
          </blockquote>
          <ul className="space-y-4 max-w-3xl">
            {audit.keyObservations.map((obs, idx) => (
              <li key={idx} className="flex items-start gap-4 text-[17px] text-[#D8CFB8] leading-relaxed">
                <span className="font-mono-data text-sm font-bold gold-text mt-1 px-2 py-0.5 border border-[#D4A24C]/40 rounded">
                  0{idx + 1}
                </span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "slide-opp",
      eyebrow: "Competitive analysis",
      title: <span className="cream-text">Social <span className="italic gold-text">strength</span> vs opposition</span>,
      subtitle: "Benchmark comparison across the nominated candidate field",
      notes: [
        `Emphasise the +11 point lead over the primary opposition — this is our moat.`,
        `Acknowledge the challenger's engagement rate; do not dismiss.`,
        `Frame the third-place candidate as the growth vector for alliance conversations.`,
      ],
      render: () => (
        <div className="max-w-4xl mx-auto space-y-5">
          {audit.candidates.map((cand) => {
            const client = cand.isClient;
            return (
              <div key={cand.id} className="grid grid-cols-12 items-center gap-4">
                <div className="col-span-4 flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${client ? "bg-[#D4A24C]" : "bg-[#5F6875]"}`}
                    aria-hidden
                  />
                  <div>
                    <div className={`text-lg ${client ? "font-bold cream-text" : "text-[#B9AF95]"}`}>
                      {cand.name}
                    </div>
                    <div className="text-[11px] text-[#8A8E9B]">{cand.party}</div>
                  </div>
                  {client && (
                    <span className="px-2 py-0.5 bg-[#D4A24C] text-[#0B1A2C] text-[10px] font-bold rounded tracking-wide">
                      CLIENT
                    </span>
                  )}
                </div>

                <div className="col-span-7 h-2.5 bg-[#142B45] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${
                      client ? "bg-gradient-to-r from-[#E07A1F] to-[#D4A24C]" : "bg-[#3A5170]"
                    }`}
                    style={{ width: `${cand.socialStrengthScore}%` }}
                  />
                </div>

                <div className="col-span-1 text-right">
                  <span className={`font-mono-data text-2xl ${client ? "gold-text font-bold" : "text-[#B9AF95]"}`}>
                    {cand.socialStrengthScore}
                  </span>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-[#8A8E9B] pt-2">Index 0-100 · Higher is stronger.</p>
        </div>
      ),
    },
    {
      id: "slide-gap",
      eyebrow: "Opportunity matrix",
      title: <span className="cream-text">Where the <span className="italic gold-text">opportunity</span> is</span>,
      subtitle: "Addressable audience gap, ranked by single-channel scale",
      notes: [
        "Lead with the hero opportunity — the platform with the biggest gap.",
        "Frame the gap as market share, not shortfall.",
        "Tee up the recommendations slide by naming the platform aloud.",
      ],
      render: () => {
        const sorted = [...audit.platformBreakdown].sort((a, b) => b.reachGap - a.reachGap);
        const max = sorted[0]?.reachGap || 1;
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            {sorted.map((item, idx) => (
              <div key={item.platform} className="space-y-2">
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-semibold ${idx === 0 ? "cream-text" : "text-[#B9AF95]"}`}>
                      {item.displayName}
                    </span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 bg-[#E07A1F]/20 text-[#E9C77A] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#E07A1F]/40">
                        Hero opportunity
                      </span>
                    )}
                  </div>
                  <div className={`font-mono-data text-2xl font-bold ${idx === 0 ? "gold-text" : "text-[#B9AF95]"}`}>
                    {formatLakhs(item.reachGap, true)}
                  </div>
                </div>
                <div className="h-3 bg-[#142B45] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${
                      idx === 0 ? "bg-gradient-to-r from-[#E07A1F] to-[#D4A24C]" : "bg-[#3A5170]"
                    }`}
                    style={{ width: `${(item.reachGap / max) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#8A8E9B] font-mono-data">
                  Constituency audience {formatLakhs(item.estimatedAudience, true)} · Current reach {formatLakhs(item.clientReach)} ({formatPercentage(item.coveragePercentage)})
                </div>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: "slide-rec",
      eyebrow: "Strategic directives",
      title: <span className="cream-text">Next <span className="italic gold-text">moves.</span></span>,
      subtitle: "Immediate field and digital manoeuvres",
      notes: [
        "Own the first directive — call it the 30-day priority.",
        "Directives 2 and 3 are supporting motions; keep them at 60-day cadence.",
        "Close with the expected impact figures — this is what the room remembers.",
      ],
      render: () => (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {audit.recommendations.slice(0, 4).map((rec) => (
            <div
              key={rec.id}
              className="p-6 rounded-xl bg-[#0F2338]/70 border border-[#22405E] hover:border-[#D4A24C]/60 transition-colors space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-xs font-bold px-2 py-0.5 bg-[#D4A24C] text-[#0B1A2C] rounded">
                  {rec.num}
                </span>
                <span className="text-[10.5px] font-bold text-[#E9C77A] uppercase tracking-[0.14em]">
                  {rec.priority} priority · {rec.category}
                </span>
              </div>
              <h3 className="font-display text-[26px] leading-tight cream-text">{rec.title}</h3>
              <p className="text-[13.5px] text-[#B9AF95] leading-relaxed">{rec.opportunity}</p>
              <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" /> {rec.expectedImpact}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "slide-close",
      eyebrow: "End of briefing",
      title: (
        <>
          <span className="cream-text">Thank you.</span>{" "}
          <span className="italic gold-text">Questions?</span>
        </>
      ),
      subtitle: `${audit.assembly.name} AC · Generated ${audit.generatedAt}`,
      notes: [
        "Invite one clarifying question before Q&A.",
        "Offer the full audit PDF as the follow-up artifact.",
        "Commit to one date to reconvene on the 30-day directive.",
      ],
      render: () => (
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-[15px] text-[#B9AF95] leading-relaxed">
            All figures triangulated from ECI electoral rolls, Meta Graph API, Google Data API
            and constituency-level social listening. Estimates flagged with a <span className="gold-text font-semibold">gold</span> ring in the
            full report.
          </p>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] gold-text">
            <span className="h-px w-8 bg-[#D4A24C]" /> Leader's Lens <span className="h-px w-8 bg-[#D4A24C]" />
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
      else if (e.key === "Escape") onExit();
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
      else if (e.key.toLowerCase() === "n") setNotesOpen((v) => !v);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onExit, slideIndex]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentSlide = slides[slideIndex];
  const progress = ((slideIndex + 1) / slides.length) * 100;

  return (
    <div
      data-testid="presentation-mode"
      className="fixed inset-0 z-50 hero-dark flex flex-col select-none overflow-hidden"
    >
      {/* Top progress rail */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#142B45]">
        <div
          className="h-full bg-gradient-to-r from-[#E07A1F] via-[#D4A24C] to-[#10B981] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 sm:px-10 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <LeadersLogo size={34} />
          <div>
            <div className="font-display text-lg cream-text leading-none">
              Leader's <span className="italic gold-text">Lens</span>
            </div>
            <div className="text-[11px] text-[#B9AF95] mt-1 tracking-wide">
              Boardroom briefing · {audit.assembly.name} AC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#B9AF95]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
            Live feed
          </div>
          <button
            data-testid="notes-toggle"
            onClick={() => setNotesOpen((v) => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              notesOpen
                ? "bg-[#D4A24C] border-[#D4A24C] text-[#0B1A2C]"
                : "bg-[#0F2338] border-[#22405E] text-[#D4A24C] hover:border-[#D4A24C]/60"
            }`}
            title="Toggle speaker notes (N)"
          >
            <NotebookText className="w-4 h-4" />
          </button>
          <button
            data-testid="fullscreen-toggle"
            onClick={toggleFullscreen}
            className="p-2 bg-[#0F2338] border border-[#22405E] rounded-lg text-[#D4A24C] hover:border-[#D4A24C]/60 transition-colors"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            data-testid="presentation-exit"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F2338] border border-[#22405E] hover:border-[#D4A24C]/60 rounded-lg text-xs font-semibold text-[#F5EFE0] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Exit · Esc
          </button>
        </div>
      </div>

      {/* Slide stage */}
      <div className={`flex-1 flex px-6 sm:px-10 py-6 gap-6 min-h-0 transition-[padding] duration-300`}>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div
            key={currentSlide.id}
            className={`transition-all duration-300 ${
              transition === "in" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="text-center space-y-3 mb-14">
              <div className="eyebrow gold-text">{currentSlide.eyebrow}</div>
              <h2 className="font-display text-[46px] sm:text-[60px] lg:text-[76px] leading-[1.02] tracking-[-0.02em]">
                {currentSlide.title}
              </h2>
              <p className="text-sm text-[#B9AF95]">{currentSlide.subtitle}</p>
            </div>
            <div>{currentSlide.render()}</div>
          </div>
        </div>

        {/* Speaker Notes side panel */}
        {notesOpen && (
          <aside
            data-testid="speaker-notes-panel"
            className={`hidden lg:flex flex-col w-[300px] shrink-0 rounded-xl border border-[#D4A24C]/25 bg-[#0F2338]/70 backdrop-blur p-4 animate-fadeIn`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <NotebookText className="w-4 h-4 text-[#D4A24C]" />
                <span className="eyebrow gold-text">Speaker notes</span>
              </div>
              <span className="text-[10px] text-[#8A8E9B] tabular">
                {String(slideIndex + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
              </span>
            </div>
            <div className="text-[11px] text-[#8A8E9B] uppercase tracking-widest font-semibold mb-2">
              For the director
            </div>
            <ul className="space-y-3 overflow-y-auto pr-1">
              {(currentSlide.notes || []).map((note, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[#D8CFB8] leading-relaxed">
                  <span className="font-mono-data text-[10px] font-bold gold-text mt-0.5 px-1.5 py-0.5 border border-[#D4A24C]/40 rounded shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 border-t border-[#22405E]/60 flex items-center justify-between text-[10px] text-[#8A8E9B]">
              <span>Press <kbd className="px-1 py-0.5 bg-[#0B1A2C] border border-[#22405E] rounded text-[9px] gold-text">N</kbd> to toggle</span>
              <span>Only you see this</span>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom stepper */}
      <div className="flex items-center justify-between px-6 sm:px-10 pb-6 pt-4 border-t border-[#22405E]/60">
        <div className="text-[11px] text-[#B9AF95] tabular">
          Slide <span className="cream-text font-semibold">{String(slideIndex + 1).padStart(2, "0")}</span> / {String(slides.length).padStart(2, "0")}
        </div>

        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToSlide(idx)}
              data-testid={`slide-dot-${idx}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === slideIndex ? "w-10 bg-[#D4A24C]" : "w-1.5 bg-[#3A5170] hover:bg-[#5F6875]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="slide-prev"
            disabled={slideIndex === 0}
            onClick={prevSlide}
            className="p-2 bg-[#0F2338] border border-[#22405E] rounded-lg text-[#D4A24C] disabled:opacity-30 hover:border-[#D4A24C]/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            data-testid="slide-next"
            disabled={slideIndex === slides.length - 1}
            onClick={nextSlide}
            className="p-2 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] disabled:opacity-30 rounded-lg text-[#0B1A2C] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const BoardMetric: React.FC<{
  label: string;
  value: string;
  suffix?: string;
  note?: string;
  tone?: "cream" | "gold" | "saffron";
}> = ({ label, value, suffix, note, tone = "cream" }) => {
  const valueColor =
    tone === "gold" ? "gold-text" : tone === "saffron" ? "text-[#F4A051]" : "cream-text";
  return (
    <div className="border-t border-[#D4A24C]/25 pt-5">
      <div className="eyebrow text-[#B9AF95]">{label}</div>
      <div className={`font-display text-[64px] sm:text-[76px] leading-none mt-3 ${valueColor}`}>
        {value}
        {suffix && <span className="text-2xl text-[#8A8E9B] ml-1 font-sans">{suffix}</span>}
      </div>
      {note && <div className="text-[11px] text-[#B9AF95] mt-2 font-mono-data">{note}</div>}
    </div>
  );
};
