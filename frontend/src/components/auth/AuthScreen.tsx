import React, { useState } from "react";
import { UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import { USER_PROFILES } from "../../services/mockData";
import { LeadersLogo } from "../common/LeadersLogo";
import { ArrowRight, Sparkles, User, KeyRound, Eye, EyeOff } from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (profile: UserProfile) => void;
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated, onBack }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    setAuthError("");
    try {
      const staticMatch = USER_PROFILES.find((p) => p.email.toLowerCase() === cleanEmail);
      if (staticMatch) {
        if (staticMatch.demoPassword && password !== staticMatch.demoPassword) {
          setAuthError("Invalid username or password.");
          return;
        }
        onAuthenticated(staticMatch);
        return;
      }

      const users = await politicalApiService.getUsers();
      const existing = users.find((p) => p.email.toLowerCase() === cleanEmail);
      if (existing) {
        if (existing.demoPassword && password !== existing.demoPassword) {
          setAuthError("Invalid username or password.");
          return;
        }
        onAuthenticated(existing);
        return;
      }

      setAuthError("Invalid username or password.");
    } catch {
      setAuthError("Invalid username or password.");
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
        className="fixed inset-0 pointer-events-none z-0 bg-black/40" 
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
          <h1 className="font-display text-2xl tracking-[-0.01em] text-[#D4A24C] font-semibold drop-shadow-md">
            Leaders Lens
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
            <Field label="Username" icon={<User className="w-3.5 h-3.5" />}>
              <input
                data-testid="email-input"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={darkInput}
                autoComplete="username"
                placeholder="admin"
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

            {authError ? <p className="text-xs text-rose-300">{authError}</p> : null}

            <button
              type="submit"
              data-testid="auth-submit-btn"
              disabled={isLoading}
              className="group w-full inline-flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-[#D97724] to-[#C99738] hover:brightness-110 text-[#0B131E] text-sm font-bold rounded-xl transition-all shadow-[0_4px_25px_-5px_rgba(217,119,36,0.6)] cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign In"}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        {/* Bottom Footer */}
        <div className="text-center pt-4 border-t border-[#D4A24C]/20 space-y-1.5">
          <p className="text-[11px] text-[#D8CFB8] font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A24C]" />
            AI-Powered Intelligence Platform
          </p>
          <p className="text-[11px] text-[#8E9CAE]">
            Developed and Maintained by{" "}
            <a
              href="https://palramai.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D4A24C] font-semibold hover:underline"
            >
              palramai.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

const darkInput =
  "w-full bg-[#0B131E] border border-[#223348] hover:border-[#D4A24C]/60 focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C]/50 rounded-xl px-3.5 py-3 text-sm text-[#F5EFE0] placeholder:text-[#8E9CAE] outline-none transition-all";

const Field: React.FC<{ label: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#BCA37F]">
      {icon}
      {label}
    </label>
    {children}
  </div>
);

