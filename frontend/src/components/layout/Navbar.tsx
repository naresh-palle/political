import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../../types";
import { LeadersLogo } from "../common/LeadersLogo";
import { USER_PROFILES } from "../../services/mockData";
import {
  Sparkles,
  Shield,
  User,
  SlidersHorizontal,
  ArrowLeft,
  Globe,
  MessageSquare,
  Users2,
  Lock,
  ChevronDown,
  LogOut,
  UserCheck
} from "lucide-react";

interface NavbarProps {
  activeProduct: "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance";
  onProductChange: (product: "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance") => void;
  isAuditView?: boolean;
  onResetToSelect?: () => void;
  currentProfile: UserProfile;
  onSwitchProfile?: (profile: UserProfile) => void;
  onOpenRoleModal?: () => void;
  onGoHome?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProduct = "pitch",
  onProductChange,
  isAuditView = false,
  onResetToSelect,
  currentProfile,
  onSwitchProfile,
  onOpenRoleModal,
  onGoHome,
  onSignOut
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header data-testid="global-navbar" className="sticky top-0 z-40 w-full bg-[#0B1A2C]/95 backdrop-blur-xl border-b border-[#D4A24C]/20 transition-all no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Left Brand */}
          <div className="flex items-center space-x-6">
            <div
              data-testid="brand-home"
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => {
                onProductChange("pitch");
                if (onResetToSelect) onResetToSelect();
              }}
              title="Constituency Intelligence Workspace"
            >
              <div className="relative w-9 h-9 rounded-[6px] overflow-hidden group-hover:brightness-110 transition-all">
                <LeadersLogo size={36} />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[22px] tracking-[-0.01em] text-[#F5EFE0] leading-none">
                  Leader's<span className="italic gold-text"> Lens</span>
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#D4A24C] mt-1">
                  Political Intelligence
                </span>
              </div>
            </div>

            {/* Back button if in audit */}
            {isAuditView && onResetToSelect && activeProduct === "pitch" && (
              <button
                onClick={onResetToSelect}
                className="hidden sm:inline-flex items-center text-xs font-medium text-[#D4A24C] hover:text-[#F5EFE0] py-1 px-2.5 rounded bg-[#0F2338] border border-[#D4A24C]/30 hover:border-[#D4A24C]/80 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Change Constituency
              </button>
            )}
          </div>

          {/* Center Navigation Products */}
          <nav data-testid="global-nav" className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onProductChange("pitch")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProduct === "pitch"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Pitch / Audit
            </button>
            <button
              onClick={() => onProductChange("grievances")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProduct === "grievances"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Grievances
            </button>
            <button
              onClick={() => onProductChange("volunteers")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProduct === "volunteers"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Volunteers
            </button>
            <button
              onClick={() => onProductChange("webbuilder")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProduct === "webbuilder"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Web Studio
            </button>
            <button
              onClick={() => onProductChange("governance")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeProduct === "governance"
                  ? "bg-[#D4A24C] text-[#0B1A2C] shadow-sm"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Team & RBAC
            </button>
          </nav>

          {/* Right Meta & User Persona */}
          <div className="flex items-center space-x-3">
            <div className="hidden xl:flex items-center space-x-2 text-xs border-r border-[#D4A24C]/20 pr-4">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                <span className="text-[11px] font-medium text-[#F5EFE0]">Live Feeds</span>
              </span>
              <span className="text-[11px] text-[#B9AF95]">· {currentProfile.assignedConstituency.split("(")[0]}</span>
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-[#142B45] border border-[#D4A24C]/25 rounded-lg hover:border-[#D4A24C]/60 transition-colors cursor-pointer"
                title="User profile & party identity menu"
              >
                <div className="relative">
                  <img
                    src={currentProfile.avatar}
                    alt={currentProfile.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#D4A24C]/40"
                  />
                  {currentProfile.partyEmoji && (
                    <span className="absolute -bottom-1 -right-1 text-[10px] drop-shadow-xs">
                      {currentProfile.partyEmoji}
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F5EFE0] leading-none">
                      {currentProfile.name.split(" ")[0]}
                    </span>
                    {currentProfile.partyAbbr && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: currentProfile.partyColor || "#B45309" }}
                      >
                        {currentProfile.partyAbbr}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[#D4A24C] mt-0.5">
                    {currentProfile.role.replace("_", " ")}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#D4A24C] transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0D2137] border border-[#D4A24C]/30 shadow-2xl p-2.5 z-50 animate-fadeIn">
                  <div className="p-2.5 border-b border-[#1E3A5A] mb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#F5EFE0]">{currentProfile.name}</div>
                      {currentProfile.partyAbbr && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs flex items-center gap-1"
                          style={{ backgroundColor: currentProfile.partyColor || "#B45309" }}
                        >
                          <span>{currentProfile.partyEmoji || "🏛️"}</span>
                          <span>{currentProfile.partyAbbr}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#B9AF95] truncate mt-0.5">{currentProfile.email}</div>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-semibold text-[#D4A24C] bg-[#071322] px-2 py-0.5 rounded border border-[#D4A24C]/30">
                        <Shield className="w-3 h-3 mr-1 text-[#D4A24C]" />
                        {currentProfile.clearanceLevel.split("(")[0]}
                      </span>
                    </div>
                  </div>

                  {/* Quick Party Persona Switcher */}
                  {onSwitchProfile && (
                    <div className="mb-2 pb-2 border-b border-[#1E3A5A]">
                      <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#D4A24C] flex items-center justify-between">
                        <span>Switch Party Persona</span>
                        <span className="text-[#B9AF95]">Auto-Themes UI</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {USER_PROFILES.map((p) => {
                          const isActive = currentProfile.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                onSwitchProfile(p);
                                setIsUserMenuOpen(false);
                              }}
                              className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 text-[11px] transition-all cursor-pointer ${
                                isActive
                                  ? "bg-[#1E3A5A] text-white border-[#D4A24C] font-bold"
                                  : "bg-[#071322] text-[#D8CFB8] border-[#1E3A5A] hover:bg-[#142B45]"
                              }`}
                            >
                              <span>{p.partyEmoji || "🏛️"}</span>
                              <span className="truncate font-semibold">{p.partyAbbr || "ADM"}: <span className="font-normal text-[#B9AF95]">{p.name.split(" ")[0]}</span></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onProductChange("governance");
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-[#D4A24C]" />
                    <span>Role & Party Customizer</span>
                  </button>

                  {onGoHome && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onGoHome();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-[#D4A24C]" />
                      <span>View Public Marketing Page</span>
                    </button>
                  )}

                  {onSignOut && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors text-left mt-1 border-t border-[#1E3A5A] cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2 border-t border-[#22405E] no-scrollbar text-xs">
          <button
            onClick={() => onProductChange("pitch")}
            className={`whitespace-nowrap px-2.5 py-1 rounded font-semibold ${
              activeProduct === "pitch" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95]"
            }`}
          >
            Audit
          </button>
          <button
            onClick={() => onProductChange("grievances")}
            className={`whitespace-nowrap px-2.5 py-1 rounded font-semibold ${
              activeProduct === "grievances" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95]"
            }`}
          >
            Grievances
          </button>
          <button
            onClick={() => onProductChange("volunteers")}
            className={`whitespace-nowrap px-2.5 py-1 rounded font-semibold ${
              activeProduct === "volunteers" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95]"
            }`}
          >
            Volunteers
          </button>
          <button
            onClick={() => onProductChange("webbuilder")}
            className={`whitespace-nowrap px-2.5 py-1 rounded font-semibold ${
              activeProduct === "webbuilder" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95]"
            }`}
          >
            Web Studio
          </button>
          <button
            onClick={() => onProductChange("governance")}
            className={`whitespace-nowrap px-2.5 py-1 rounded font-semibold ${
              activeProduct === "governance" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95]"
            }`}
          >
            Team & RBAC
          </button>
        </div>
      </div>
    </header>
  );
};
