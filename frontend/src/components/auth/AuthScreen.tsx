import React, { useState } from "react";
import { UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import { USER_PROFILES } from "../../services/mockData";
import { LeadersLogo } from "../common/LeadersLogo";
import { ArrowRight, Sparkles, ShieldCheck, Mail, KeyRound, Lock, Eye, EyeOff } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onBack }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    
    try {
      // 1. Instant check in core USER_PROFILES
      const staticMatch = USER_PROFILES.find((p) => p.email.toLowerCase() === cleanEmail);
      if (staticMatch) {
        onAuthenticated(staticMatch);
        return;
      }

      // 2. Check if user exists in database / dynamic roster
      const users = await politicalApiService.getUsers();
      const existing = users.find((p) => p.email.toLowerCase() === cleanEmail);
      if (existing) {
        onAuthenticated(existing);
        return;
      }

      // 3. Dynamic resolution for custom credentials with proper role deduction
      const isVolunteerEmail = cleanEmail.startsWith("volunteer.") || cleanEmail.includes(".vol");
      const isDirectorEmail = cleanEmail.startsWith("director.") || cleanEmail.includes(".dir");
      const isMlaEmail = cleanEmail.startsWith("mla.") || cleanEmail.includes(".mla");
      const isSuperAdminEmail = cleanEmail === "admin@leaderslens.ai" || cleanEmail === "support@leaderslens.ai";

      const displayName =
        cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        "Executive Officer";

      const newProfile: UserProfile = {
        id: `usr_${Date.now()}`,
        name: displayName,
        email: cleanEmail || "admin@leaderslens.ai",
        demoPassword: password || "Secure@2026",
        primaryRole: isVolunteerEmail
          ? "VOLUNTEER"
          : isDirectorEmail
          ? "DIRECTOR"
          : isMlaEmail
          ? "POLITICAL_ADMIN"
          : isSuperAdminEmail
          ? "SUPER_ADMIN"
          : "DIRECTOR",
        isPlatformAdmin: isSuperAdminEmail,
        isPoliticalAdmin: isMlaEmail,
        role: isVolunteerEmail ? "volunteer" : isDirectorEmail ? "campaign_manager" : isMlaEmail ? "admin" : "super_admin",
        roleId: isVolunteerEmail ? "VOLUNTEER" : isDirectorEmail ? "CAMPAIGN_MANAGER" : isMlaEmail ? "ADMIN" : "SUPER_ADMIN",
        roleTitle: isVolunteerEmail
          ? "Booth & Village Field Volunteer"
          : isDirectorEmail
          ? "Constituency Campaign Director"
          : isMlaEmail
          ? "Constituency Political Admin (MLA)"
          : "Master System Administrator",
        department: isVolunteerEmail
          ? "Grassroots Field Force"
          : isDirectorEmail
          ? "Ground Field Operations"
          : isMlaEmail
          ? "Constituency Political Office"
          : "Platform Governance & Core Security",
        avatar: isVolunteerEmail
          ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80"
          : isDirectorEmail
          ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
          : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
        assignedConstituency: isSuperAdminEmail ? "LeaderLens National Command Center" : "Kadapa AC (AC-132)",
        clearanceLevel: isVolunteerEmail
          ? "LEVEL 1 — FIELD ONLY"
          : isDirectorEmail
          ? "LEVEL 3 — STRATEGY"
          : isMlaEmail
          ? "LEVEL 4 — CONSTITUENCY COMMAND"
          : "LEVEL 5 — FULL SYSTEM",
        partyId: isSuperAdminEmail ? null : "TDP",
        partyName: isSuperAdminEmail ? undefined : "Telugu Desam Party",
        partyAbbr: isSuperAdminEmail ? undefined : "TDP",
        partyColor: isSuperAdminEmail ? "#D4A24C" : "#FFD200",
        partyEmoji: isSuperAdminEmail ? "🏛️" : "🚲",
        permissions: {
          canExportReports: !isVolunteerEmail,
          canEditStrategy: !isVolunteerEmail,
          canManageVolunteers: !isVolunteerEmail,
          canResolveGrievances: true,
          canPublishLandingPage: isSuperAdminEmail || isMlaEmail,
          canViewConfidentialMetrics: !isVolunteerEmail,
          canManageSystemUsers: isSuperAdminEmail
        }
      };
      onAuthenticated(newProfile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="hero-dark min-h-screen w-full flex flex-col lg:flex-row items-stretch relative overflow-x-hidden bg-[#071322]"
      style={{
        backgroundImage: "url(./images/india_parliament_bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Light subtle gradient overlay only on the background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-black/25" 
        aria-hidden="true" 
      />

      {/* Left Area (Entire Assembly building is 100% visible and unobstructed) */}
      <div className="flex-1 hidden lg:flex flex-col justify-between p-10 xl:p-14 relative z-10">
        <div />
        {/* Minimal subtle badge at bottom-left corner */}
        <div className="p-3.5 rounded-xl bg-[#071322]/60 backdrop-blur-md border border-[#D4A24C]/25 max-w-sm">
          <p className="text-xs text-[#EADBBF] font-medium tracking-wide">
            National Political Intelligence & Strategic Governance System
          </p>
        </div>
      </div>

      {/* Right Side Dedicated Sign In Panel (Transparent Glassmorphic with Parliament visible through) */}
      <div className="w-full lg:w-[420px] xl:w-[460px] min-h-screen bg-[#071322]/45 backdrop-blur-xl border-l border-[#D4A24C]/30 flex flex-col justify-between p-6 sm:p-10 z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] shrink-0 animate-fadeIn">
        {/* Top Official Branding */}
        <div className="flex flex-col items-center text-center pt-2 sm:pt-4">
          <div className="p-2 rounded-2xl bg-[#071322]/60 backdrop-blur-md border border-[#D4A24C]/40 shadow-xl mb-2.5">
            <LeadersLogo size={46} />
          </div>
          <h1 className="font-display text-2xl tracking-[0.14em] text-[#F5EFE0] uppercase font-bold drop-shadow-md">
            LEADERS<span className="gold-text">LENS</span>
          </h1>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#D4A24C] font-semibold mt-1 font-mono drop-shadow">
            CONSULTING
          </p>
        </div>

        {/* Center Sign In Form */}
        <div className="my-auto py-6">
          <div className="mb-6 text-left">
            <h2 className="text-xl font-bold text-[#F5EFE0] tracking-wide drop-shadow-md">Sign In</h2>
            <p className="text-xs text-[#D8CFB8] mt-1 font-medium">Enter your verified credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Work email" icon={<Mail className="w-3.5 h-3.5" />}>
              <input
                data-testid="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={darkInput}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" icon={<KeyRound className="w-3.5 h-3.5" />}>
              <div className="relative">
                <input
                  data-testid="password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${darkInput} pr-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4A24C] hover:text-white transition-colors p-1 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              data-testid="auth-submit-btn"
              disabled={isLoading}
              className="group w-full inline-flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-sm font-bold rounded-xl transition-all shadow-[0_8px_24px_-8px_rgba(224,122,31,0.55)] cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        {/* Bottom Footer */}
        <div className="text-center pt-4 border-t border-[#D4A24C]/20">
          <p className="text-[11px] text-[#D8CFB8] font-medium">
            Protected by Leader's Lens Security Framework
          </p>
        </div>
      </div>
    </div>
  );
};

const darkInput =
  "w-full bg-[#071322]/60 backdrop-blur-md border border-[#22405E] hover:border-[#D4A24C]/60 focus:border-[#D4A24C] focus:ring-2 focus:ring-[#D4A24C]/40 rounded-lg px-3 py-2.5 text-[13.5px] text-[#F5EFE0] placeholder:text-[#8E9CAE] outline-none transition-all";

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B9AF95]">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

