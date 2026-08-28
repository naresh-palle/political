import React, { useState } from "react";
import { CampaignLandingConfig, WebsiteTheme } from "../../types";
import { DEFAULT_CAMPAIGN_CONFIG } from "../../services/mockData";
import {
  Globe,
  Layout,
  Palette,
  Code2,
  Check,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Sparkles,
  Download,
  Share2,
  HeartHandshake,
  MessageSquare,
  Calendar,
  Droplets,
  Briefcase,
  HeartPulse,
  ExternalLink
} from "lucide-react";

export const CampaignWebsiteGenerator: React.FC = () => {
  const [config, setConfig] = useState<CampaignLandingConfig>(DEFAULT_CAMPAIGN_CONFIG);
  const [activeTab, setActiveTab] = useState<"content" | "theme" | "sections" | "export">("content");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);

  // Form submission simulation in preview
  const [volunteerName, setVolunteerName] = useState("");
  const [volunteerPhone, setVolunteerPhone] = useState("");
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(false);

  const getThemeStyles = (theme: WebsiteTheme) => {
    switch (theme) {
      case "regal_navy":
        return {
          primary: "bg-[#0F172A] text-white",
          secondary: "bg-[#1E293B]",
          accent: "text-[#38BDF8]",
          button: "bg-[#0284C7] hover:bg-[#0369A1] text-white",
          cardBg: "bg-white",
          heroBg: "bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white"
        };
      case "amber_sunset":
        return {
          primary: "bg-[#78350F] text-white",
          secondary: "bg-[#92400E]",
          accent: "text-[#F59E0B]",
          button: "bg-[#D97706] hover:bg-[#B45309] text-white",
          cardBg: "bg-white",
          heroBg: "bg-gradient-to-b from-[#78350F] via-[#92400E] to-[#451A03] text-white"
        };
      case "modern_monochrome":
        return {
          primary: "bg-[#111827] text-white",
          secondary: "bg-[#1F2937]",
          accent: "text-[#9CA3AF]",
          button: "bg-[#111827] hover:bg-black text-white",
          cardBg: "bg-white",
          heroBg: "bg-gradient-to-b from-[#111827] via-[#1F2937] to-[#111827] text-white"
        };
      default: // civic_emerald
        return {
          primary: "bg-[#064E3B] text-white",
          secondary: "bg-[#065F46]",
          accent: "text-[#34D399]",
          button: "bg-[#059669] hover:bg-[#047857] text-white",
          cardBg: "bg-white",
          heroBg: "bg-gradient-to-b from-[#064E3B] via-[#065F46] to-[#022C22] text-white"
        };
    }
  };

  const themeStyle = getThemeStyles(config.theme);

  const handleCopyCode = () => {
    const code = `<!-- Leader's Lens Campaign Landing Page: ${config.candidateName} -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config.candidateName} — ${config.constituency}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900 font-sans">
  <header class="${themeStyle.primary} py-6 px-8 text-center">
    <h1 class="text-4xl font-bold">${config.candidateName}</h1>
    <p class="text-lg opacity-90">${config.tagline}</p>
  </header>
</body>
</html>`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E3D8] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-semibold uppercase tracking-widest text-[#787B88]">
            <span>Platform Pillar 4</span>
            <span>/</span>
            <span className="text-[#112233]">Constituency Web Studio</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl text-[#112233] font-normal mt-1">
            Campaign Landing Page Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#626674]">
            Generate, customize, and publish executive campaign landing pages for nominated candidates with interactive volunteer and grievance intake.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLivePreviewOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-white border border-[#D5D3C8] text-[#112233] text-xs font-semibold rounded-lg hover:bg-[#F2F1EB] transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Full Screen Preview
          </button>
          <button
            onClick={handleCopyCode}
            className="inline-flex items-center px-4 py-2 bg-[#112233] text-white text-xs font-semibold rounded-lg hover:bg-[#07121F] transition-colors shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            {copiedCode ? "Copied HTML!" : "Export / Copy Code"}
          </button>
        </div>
      </div>

      {/* Main Studio Grid (Left Config Panel vs Right Live Viewport) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Config Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E0DED5] rounded-xl p-6 shadow-xs space-y-6">
          {/* Sub Navigation */}
          <div className="flex items-center space-x-1 border-b border-[#ECEAE2] pb-3 text-xs">
            <button
              onClick={() => setActiveTab("content")}
              className={`px-3 py-1.5 rounded font-semibold transition-all ${
                activeTab === "content" ? "bg-[#112233] text-white" : "text-[#696D7A] hover:bg-[#EFEFE8]"
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`px-3 py-1.5 rounded font-semibold transition-all ${
                activeTab === "theme" ? "bg-[#112233] text-white" : "text-[#696D7A] hover:bg-[#EFEFE8]"
              }`}
            >
              Theme & Colors
            </button>
            <button
              onClick={() => setActiveTab("sections")}
              className={`px-3 py-1.5 rounded font-semibold transition-all ${
                activeTab === "sections" ? "bg-[#112233] text-white" : "text-[#696D7A] hover:bg-[#EFEFE8]"
              }`}
            >
              Sections & Widgets
            </button>
          </div>

          {/* Tab 1: Content Customization */}
          {activeTab === "content" && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Candidate Full Name</label>
                <input
                  type="text"
                  value={config.candidateName}
                  onChange={(e) => setConfig({ ...config, candidateName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Campaign Tagline</label>
                <input
                  type="text"
                  value={config.tagline}
                  onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#555866]">Subheadline / Mission Statement</label>
                <textarea
                  rows={3}
                  value={config.subheadline}
                  onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Constituency</label>
                  <input
                    type="text"
                    value={config.constituency}
                    onChange={(e) => setConfig({ ...config, constituency: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#555866]">Party Nomination</label>
                  <input
                    type="text"
                    value={config.partyName}
                    onChange={(e) => setConfig({ ...config, partyName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#D5D3C8] rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Theme & Visual Styles */}
          {activeTab === "theme" && (
            <div className="space-y-4 text-xs">
              <label className="text-[10px] uppercase font-bold text-[#555866] block">Select Editorial Design Theme</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "civic_emerald" })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    config.theme === "civic_emerald"
                      ? "border-[#064E3B] bg-emerald-50 ring-2 ring-[#064E3B]"
                      : "border-[#E5E3D8] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="w-full h-4 rounded bg-[#064E3B] mb-2" />
                  <div className="font-bold text-[#112233]">Civic Emerald</div>
                  <div className="text-[10px] text-[#696D7A]">Governance & Prosperity</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "regal_navy" })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    config.theme === "regal_navy"
                      ? "border-[#0F172A] bg-slate-50 ring-2 ring-[#0F172A]"
                      : "border-[#E5E3D8] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="w-full h-4 rounded bg-[#0F172A] mb-2" />
                  <div className="font-bold text-[#112233]">Regal Navy</div>
                  <div className="text-[10px] text-[#696D7A]">Authoritative Executive</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "amber_sunset" })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    config.theme === "amber_sunset"
                      ? "border-[#78350F] bg-amber-50 ring-2 ring-[#78350F]"
                      : "border-[#E5E3D8] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="w-full h-4 rounded bg-[#B45309] mb-2" />
                  <div className="font-bold text-[#112233]">Sunset Amber</div>
                  <div className="text-[10px] text-[#696D7A]">Grassroots Warmth</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, theme: "modern_monochrome" })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    config.theme === "modern_monochrome"
                      ? "border-[#111827] bg-gray-50 ring-2 ring-[#111827]"
                      : "border-[#E5E3D8] hover:bg-[#FAF9F5]"
                  }`}
                >
                  <div className="w-full h-4 rounded bg-[#111827] mb-2" />
                  <div className="font-bold text-[#112233]">Monochrome Pro</div>
                  <div className="text-[10px] text-[#696D7A]">High-End Editorial</div>
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Section Toggles */}
          {activeTab === "sections" && (
            <div className="space-y-3 text-xs">
              <label className="text-[10px] uppercase font-bold text-[#555866] block">Landing Page Modules</label>
              
              <label className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg cursor-pointer">
                <span className="font-medium text-[#112233]">Key Manifesto Pillars (3 Points)</span>
                <input
                  type="checkbox"
                  checked={config.showManifesto}
                  onChange={(e) => setConfig({ ...config, showManifesto: e.target.checked })}
                  className="rounded text-[#112233]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg cursor-pointer">
                <span className="font-medium text-[#112233]">Townhall & Event Schedule</span>
                <input
                  type="checkbox"
                  checked={config.showTimeline}
                  onChange={(e) => setConfig({ ...config, showTimeline: e.target.checked })}
                  className="rounded text-[#112233]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg cursor-pointer">
                <span className="font-medium text-[#112233]">Volunteer Mobilization Intake Form</span>
                <input
                  type="checkbox"
                  checked={config.showVolunteerIntake}
                  onChange={(e) => setConfig({ ...config, showVolunteerIntake: e.target.checked })}
                  className="rounded text-[#112233]"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg cursor-pointer">
                <span className="font-medium text-[#112233]">Citizen Grievance Submission Box</span>
                <input
                  type="checkbox"
                  checked={config.showGrievanceForm}
                  onChange={(e) => setConfig({ ...config, showGrievanceForm: e.target.checked })}
                  className="rounded text-[#112233]"
                />
              </label>
            </div>
          )}
        </div>

        {/* Right Live Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Device Switcher Bar */}
          <div className="flex items-center justify-between bg-white border border-[#E0DED5] rounded-xl p-2.5 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#112233]">
              <Globe className="w-4 h-4 text-[#0F766E]" />
              <span>Live Website Preview</span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-1.5 rounded ${previewDevice === "desktop" ? "bg-[#112233] text-white" : "text-[#777B88] hover:bg-[#EFEFE8]"}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-1.5 rounded ${previewDevice === "tablet" ? "bg-[#112233] text-white" : "text-[#777B88] hover:bg-[#EFEFE8]"}`}
                title="Tablet View"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-1.5 rounded ${previewDevice === "mobile" ? "bg-[#112233] text-white" : "text-[#777B88] hover:bg-[#EFEFE8]"}`}
                title="Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Simulated Web Frame */}
          <div className="flex justify-center bg-[#ECE9E0] p-4 rounded-xl border border-[#D8D5C8] overflow-hidden">
            <div
              className={`bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-300 transition-all duration-300 ${
                previewDevice === "mobile"
                  ? "w-[360px]"
                  : previewDevice === "tablet"
                  ? "w-[600px]"
                  : "w-full"
              }`}
            >
              {/* Browser Address Bar */}
              <div className="bg-[#F3F2EB] px-4 py-2 border-b border-[#E2E0D5] flex items-center space-x-2 text-[10px] text-[#717582]">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 bg-white px-2 py-0.5 rounded text-center font-mono-data">
                  https://{config.candidateName.toLowerCase().replace(/\s+/g, "")}.campaign2026.in
                </div>
              </div>

              {/* Campaign Page Body */}
              <div className="max-h-[600px] overflow-y-auto font-sans">
                {/* Hero Header */}
                <div className={`${themeStyle.heroBg} p-6 sm:p-10 text-center space-y-3`}>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/10 rounded-full ${themeStyle.accent}`}>
                    {config.partyName} · {config.constituency}
                  </span>
                  <h2 className="font-editorial text-3xl sm:text-4xl font-normal leading-tight">
                    {config.candidateName}
                  </h2>
                  <p className="text-sm opacity-90 max-w-md mx-auto italic font-editorial">
                    "{config.tagline}"
                  </p>
                  <p className="text-xs opacity-80 max-w-lg mx-auto leading-relaxed pt-1">
                    {config.subheadline}
                  </p>

                  <div className="pt-3 flex justify-center space-x-3">
                    <button className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-md ${themeStyle.button}`}>
                      Join as Volunteer
                    </button>
                    <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20">
                      Submit Issue
                    </button>
                  </div>
                </div>

                {/* Manifesto Pillars Section */}
                {config.showManifesto && (
                  <div className="p-6 bg-[#FAF9F5] border-b border-[#E5E3D8] space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#787B88]">
                        Action Blueprint
                      </span>
                      <h3 className="font-editorial text-2xl text-[#112233] mt-0.5">
                        Core Development Pillars
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {config.manifestoPillars.map((p, idx) => (
                        <div key={idx} className="p-3.5 bg-white border border-[#E2E0D6] rounded-lg shadow-2xs space-y-1">
                          <h4 className="text-xs font-bold text-[#112233] flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] mr-1.5" />
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-[#555866] leading-relaxed">
                            {p.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events / Townhalls */}
                {config.showTimeline && (
                  <div className="p-6 bg-white border-b border-[#E5E3D8] space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#787B88] block text-center">
                      On-Ground Townhalls
                    </span>
                    <div className="space-y-2">
                      {config.upcomingEvents.map((evt, idx) => (
                        <div key={idx} className="p-3 bg-[#FAF9F5] border border-[#E5E3D8] rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-[#112233]">{evt.title}</div>
                            <div className="text-[10px] text-[#717582]">{evt.location}</div>
                          </div>
                          <span className="font-mono-data text-[10px] font-bold text-[#0F766E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {evt.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Volunteer Intake Widget */}
                {config.showVolunteerIntake && (
                  <div className="p-6 bg-[#FAF9F5] border-b border-[#E5E3D8] space-y-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#787B88]">
                      Grassroots Movement
                    </span>
                    <h3 className="font-editorial text-xl text-[#112233]">
                      Join the Digital Volunteer Squad
                    </h3>

                    {volunteerSubmitted ? (
                      <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        ✓ Thank you! The constituency volunteer desk will WhatsApp your welcome packet shortly.
                      </div>
                    ) : (
                      <div className="space-y-2 max-w-sm mx-auto text-xs">
                        <input
                          type="text"
                          placeholder="Your Full Name"
                          value={volunteerName}
                          onChange={(e) => setVolunteerName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp Mobile Number"
                          value={volunteerPhone}
                          onChange={(e) => setVolunteerPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#D5D3C8] rounded-lg"
                        />
                        <button
                          onClick={() => setVolunteerSubmitted(true)}
                          className={`w-full py-2 rounded-lg text-xs font-semibold ${themeStyle.button}`}
                        >
                          Register for Ward Relay
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className={`${themeStyle.primary} p-4 text-center text-[10px] opacity-80`}>
                  © 2026 {config.candidateName} Official Campaign · {config.constituency}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
