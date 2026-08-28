import React, { useEffect, useState } from "react";

interface SectionItem {
  id: string;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: "section-overview", label: "Overview" },
  { id: "section-candidates", label: "Candidates" },
  { id: "section-footprint", label: "Digital Footprint" },
  { id: "section-issues", label: "Issue Intelligence" },
  { id: "section-opposition", label: "Opposition" },
  { id: "section-voters", label: "Voters" },
  { id: "section-digital-audience", label: "Digital Audience" },
  { id: "section-reach-gap", label: "Reach Gap" },
  { id: "section-recommendations", label: "Recommendations" },
  { id: "section-scorecard", label: "Scorecard" },
  { id: "section-methodology", label: "Data & Methodology" }
];

export const AuditNav: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("section-overview");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (const section of SECTIONS) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div data-testid="audit-nav" className="sticky top-[64px] z-30 bg-[#FBFBF9]/92 backdrop-blur-xl border-b border-[#E5E3D8] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                data-testid={`nav-${section.id}`}
                className={`relative whitespace-nowrap px-3 py-3.5 text-[12.5px] transition-colors cursor-pointer ${
                  isActive
                    ? "text-[#112233] font-semibold"
                    : "text-[#676B78] hover:text-[#112233] font-medium"
                }`}
              >
                {section.label}
                <span
                  className={`absolute left-3 right-3 -bottom-px h-[2px] rounded-full transition-all ${
                    isActive ? "bg-[#112233] opacity-100" : "bg-transparent opacity-0"
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
