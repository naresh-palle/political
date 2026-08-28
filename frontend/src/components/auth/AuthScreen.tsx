import React, { useState } from "react";
import { UserProfile } from "../../types";
import { USER_PROFILES } from "../../services/mockData";
import { LeadersLogo } from "../common/LeadersLogo";
import { ArrowRight, Sparkles, ShieldCheck, Mail, KeyRound } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [selectedRole, setSelectedRole] = useState<string>(USER_PROFILES[0].id);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = USER_PROFILES.find((p) => p.id === selectedRole) || USER_PROFILES[0];
    onAuthenticated(profile);
  };

  const handleGoogle = () => {
    const profile = USER_PROFILES.find((p) => p.id === selectedRole) || USER_PROFILES[0];
    onAuthenticated(profile);
  };

  return (
    <div className="hero-dark min-h-screen flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center animate-rise">
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
            <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" /> Verified ECI + Meta data</span>
          </div>
        </div>

        {/* Auth card right */}
        <div className="lg:col-span-2">
          <div
            data-testid="auth-card"
            className="bg-[#0E2137]/85 backdrop-blur border border-[#D4A24C]/25 rounded-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            <div className="flex border-b border-[#22405E]">
              <TabBtn active={mode === "signin"} onClick={() => setMode("signin")} testid="tab-signin">Sign in</TabBtn>
              <TabBtn active={mode === "signup"} onClick={() => setMode("signup")} testid="tab-signup">Sign up</TabBtn>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
              <button
                type="button"
                onClick={handleGoogle}
                data-testid="google-signin-btn"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5EFE0] hover:bg-white text-[#0B1A2C] text-[13.5px] font-semibold rounded-md transition-colors"
              >
                <GoogleG /> Continue with Google
              </button>

              <div className="flex items-center gap-3 text-[10.5px] tracking-widest uppercase text-[#8A8E9B]">
                <span className="flex-1 h-px bg-[#22405E]" />
                or use email
                <span className="flex-1 h-px bg-[#22405E]" />
              </div>

              {mode === "signup" && (
                <Field label="Full name">
                  <input
                    data-testid="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Naresh Palle"
                    className={darkInput}
                  />
                </Field>
              )}

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

              <Field label="Continue as (RBAC role)">
                <select
                  data-testid="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className={`${darkInput} appearance-none pr-8`}
                >
                  {USER_PROFILES.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0B1A2C] text-[#F5EFE0]">
                      {p.roleTitle}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                type="submit"
                data-testid="auth-submit-btn"
                className="group w-full inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:brightness-110 text-[#0B1A2C] text-[13.5px] font-bold rounded-md transition-all shadow-[0_8px_24px_-8px_rgba(224,122,31,0.55)]"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-[11px] text-center text-[#8A8E9B]">
                By continuing you agree to Leader's Lens Terms & Confidentiality Framework.
              </p>
            </form>
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

const TabBtn: React.FC<{ active: boolean; onClick: () => void; testid: string; children: React.ReactNode }> = ({ active, onClick, testid, children }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testid}
    className={`flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
      active ? "text-[#D4A24C] border-b-2 border-[#D4A24C]" : "text-[#8A8E9B] hover:text-[#F5EFE0]"
    }`}
  >
    {children}
  </button>
);

const GoogleG: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/>
  </svg>
);
