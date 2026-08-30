import React, { useState } from "react";
import { UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import { LeadersLogo } from "../common/LeadersLogo";
import { ArrowRight, Sparkles, ShieldCheck, Mail, KeyRound, Lock } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onBack }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    
    try {
      // Check if user exists in database / dynamic roster
      const users = await politicalApiService.getUsers();
      const existing = users.find((p) => p.email.toLowerCase() === cleanEmail);
      if (existing) {
        onAuthenticated(existing);
        return;
      }

      // Dynamic resolution for new / custom credentials
      const displayName =
        cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "Campaign Director";

      const newProfile: UserProfile = {
        id: `usr_${Date.now()}`,
        name: displayName,
        email: cleanEmail || "admin@leaderslens.ai",
        demoPassword: password || "Secure@2026",
        role: "super_admin",
        roleId: "SUPER_ADMIN",
        roleTitle: "Master System Administrator",
        department: "Platform Governance & Core Security",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        assignedConstituency: "National Command Center",
        clearanceLevel: "LEVEL 5 — FULL SYSTEM",
        partyId: null,
        partyName: undefined,
        partyAbbr: undefined,
        partyColor: "#D4A24C",
        partyEmoji: "🏛️",
        permissions: {
          canExportReports: true,
          canEditStrategy: true,
          canManageVolunteers: true,
          canResolveGrievances: true,
          canPublishLandingPage: true,
          canViewConfidentialMetrics: true,
          canManageSystemUsers: true
        }
      };
      onAuthenticated(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="hero-dark min-h-screen flex flex-col justify-between px-4 py-8 sm:py-12 relative"
      style={{
        backgroundImage: "url(./images/party-backgrounds/admin-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#0B1A2C]/65 backdrop-blur-[0.5px]" aria-hidden="true" />
      <div className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full">
        {/* Top back navigation bar */}
        <div className="w-full flex items-center justify-between pb-6">
        <button
          type="button"
          onClick={onBack}
          data-testid="auth-back-btn"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4A24C] hover:text-[#F5EFE0] px-3.5 py-2 rounded-lg bg-[#0F2338] border border-[#D4A24C]/30 hover:border-[#D4A24C]/80 transition-all cursor-pointer shadow-sm"
        >
          <span>← Back to Overview / Home</span>
        </button>

        <div
          onClick={onBack}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Return to Home"
        >
          <LeadersLogo size={30} />
          <span className="font-display text-[18px] cream-text leading-none group-hover:text-[#D4A24C] transition-colors">
            Leader's <span className="italic gold-text">Lens</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center animate-rise flex-1">
        {/* Editorial left */}
        <div className="lg:col-span-3 space-y-7">
          <div className="flex items-center gap-3">
            <LeadersLogo size={40} />
            <div>
              <div className="font-display text-[22px] cream-text leading-none">
                Leader's <span className="italic gold-text">Lens</span>
              </div>
              <div className="eyebrow text-[#D4A24C] mt-1">Political Intelligence</div>
            </div>
          </div>

          <h1 className="font-display text-[34px] sm:text-[40px] lg:text-[48px] leading-[1.05] tracking-[-0.02em]">
            <span className="cream-text">Sign in to your</span>{" "}
            <span className="italic gold-text">command room.</span>
          </h1>
          <p className="text-sm text-[#D8CFB8] max-w-md leading-relaxed">
            Constituency intelligence, grievance operations and volunteer command — access
            calibrated to your role, from the field to the executive briefing.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-[#B9AF95]">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role-based access</span>
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" /> Verified ECI Data Hierarchy</span>
          </div>

          {/* Quick Demo Credentials Selector */}
          <div className="p-4 rounded-xl bg-[#0E2137]/90 border border-[#D4A24C]/30 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A24C] block">
              Quick 4-Tier Persona Login:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@leaderslens.ai");
                  setPassword("SuperAdmin@2026");
                }}
                className="p-2 rounded-lg bg-[#071322] border border-[#22405E] hover:border-[#D4A24C] text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#F5EFE0] block text-[11px]">LEVEL 1: PLATFORM ADMIN</strong>
                <span className="text-[#8A8E9B] text-[9.5px] block truncate">admin@leaderslens.ai</span>
                <span className="text-[#D4A24C] text-[9.5px] font-mono">SuperAdmin@2026</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("mla.kadapa@leaderslens.ai");
                  setPassword("MlaKadapa@2026");
                }}
                className="p-2 rounded-lg bg-[#071322] border border-[#22405E] hover:border-[#D4A24C] text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#F5EFE0] block text-[11px]">LEVEL 2: POLITICAL (MLA)</strong>
                <span className="text-[#8A8E9B] text-[9.5px] block truncate">mla.kadapa@leaderslens.ai</span>
                <span className="text-[#D4A24C] text-[9.5px] font-mono">MlaKadapa@2026</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("director.kadapa.urban@leaderslens.ai");
                  setPassword("DirectorKadapaUrban@2026");
                }}
                className="p-2 rounded-lg bg-[#071322] border border-[#22405E] hover:border-[#D4A24C] text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#F5EFE0] block text-[11px]">LEVEL 3: DIRECTOR</strong>
                <span className="text-[#8A8E9B] text-[9.5px] block truncate">director.kadapa.urban@leaderslens.ai</span>
                <span className="text-[#D4A24C] text-[9.5px] font-mono">DirectorKadapaUrban@2026</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("volunteer.kadapa.urban1@leaderslens.ai");
                  setPassword("VolunteerKadapa1@2026");
                }}
                className="p-2 rounded-lg bg-[#071322] border border-[#22405E] hover:border-[#D4A24C] text-left transition-colors cursor-pointer"
              >
                <strong className="text-[#F5EFE0] block text-[11px]">LEVEL 4: VOLUNTEER</strong>
                <span className="text-[#8A8E9B] text-[9.5px] block truncate">volunteer.kadapa.urban1@leaderslens.ai</span>
                <span className="text-[#D4A24C] text-[9.5px] font-mono">VolunteerKadapa1@2026</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#8E9CAE]">
            Developed and Maintained by{" "}
            <a
              href="https://palramai.in"
              target="_blank"
              rel="noreferrer"
              className="text-[#D4A24C] hover:underline font-semibold"
            >
              palramai.in
            </a>
          </div>
        </div>

        {/* Auth card right */}
        <div className="lg:col-span-2">
          <div
            data-testid="auth-card"
            className="bg-[#0E2137]/85 backdrop-blur border border-[#D4A24C]/25 rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#22405E] bg-[#071322]/60 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#142B45] border border-[#D4A24C]/40 text-[#D4A24C] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F5EFE0] uppercase tracking-wider">Executive Sign In</h3>
                <p className="text-[11px] text-[#8A8E9B]">Enter official credentials or select persona</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
              <Field label="Work email" icon={<Mail className="w-3.5 h-3.5" />}>
                <input
                  data-testid="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@leaderslens.ai"
                  className={darkInput}
                />
              </Field>
              <Field label="Password" icon={<KeyRound className="w-3.5 h-3.5" />}>
                <input
                  data-testid="password-input"
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={darkInput}
                />
              </Field>

              <button
                type="submit"
                data-testid="auth-submit-btn"
                disabled={isLoading}
                className="group w-full inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-[13.5px] font-bold rounded-md transition-all shadow-[0_8px_24px_-8px_rgba(224,122,31,0.55)] cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? "Authenticating..." : "Sign in to Command Room"}</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-[11px] text-center text-[#8A8E9B] pt-1">
                By continuing you agree to Leader's Lens Terms & Confidentiality Framework.
              </p>
            </form>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const darkInput =
  "w-full bg-[#0B1A2C] border border-[#22405E] hover:border-[#D4A24C]/60 focus:border-[#D4A24C] focus:ring-2 focus:ring-[#D4A24C]/40 rounded-md px-3 py-2.5 text-[13.5px] text-[#F5EFE0] placeholder:text-[#5F6875] outline-none transition-colors";

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B9AF95]">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

