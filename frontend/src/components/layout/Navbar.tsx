import React, { useState } from "react";
import { UserProfile } from "../../types";
import { LeadersLogo } from "../common/LeadersLogo";
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
  ChevronDown
} from "lucide-react";

interface NavbarProps {
  activeProduct: "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance";
  onProductChange: (product: "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance") => void;
  isAuditView?: boolean;
  onResetToSelect?: () => void;
  currentProfile: UserProfile;
  onOpenRoleModal?: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProduct = "pitch",
  onProductChange,
  isAuditView = false,
  onResetToSelect,
  currentProfile,
  onOpenRoleModal,
  onGoHome
}) => {
  return (
    <header data-testid="global-navbar" className="sticky top-0 z-40 w-full bg-[#0B1A2C]/95 backdrop-blur-xl border-b border-[#D4A24C]/20 transition-all no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Left Brand */}
          <div className="flex items-center space-x-6">
            <div
              data-testid="brand-home"
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={onGoHome || onResetToSelect}
              title="Return to Public Overview / Home"
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
          <nav data-testid="global-nav" className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onProductChange("pitch")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeProduct === "pitch"
                  ? "text-[#0B1A2C] bg-[#D4A24C] shadow-[0_4px_16px_-4px_rgba(212,162,76,0.5)]"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Strength Audit
            </button>
            <button
              onClick={() => onProductChange("grievances")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeProduct === "grievances"
                  ? "text-[#0B1A2C] bg-[#D4A24C]"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Grievance CRM
            </button>
            <button
              onClick={() => onProductChange("volunteers")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeProduct === "volunteers"
                  ? "text-[#0B1A2C] bg-[#D4A24C]"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Volunteers
            </button>
            <button
              onClick={() => onProductChange("webbuilder")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeProduct === "webbuilder"
                  ? "text-[#0B1A2C] bg-[#D4A24C]"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Web Studio
            </button>
            <button
              onClick={() => onProductChange("governance")}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                activeProduct === "governance"
                  ? "text-[#0B1A2C] bg-[#D4A24C]"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              Team & RBAC
            </button>
          </nav>

          {/* Right Meta & User Persona */}
          <div className="flex items-center space-x-3">
            {onGoHome && (
              <button
                onClick={onGoHome}
                data-testid="nav-home-btn"
                className="hidden md:inline-flex items-center text-xs font-semibold text-[#D4A24C] hover:text-[#F5EFE0] px-2.5 py-1.5 rounded bg-[#0F2338] border border-[#D4A24C]/25 hover:border-[#D4A24C]/70 transition-all cursor-pointer"
                title="View Public Overview Landing Page"
              >
                <span>Public Overview</span>
              </button>
            )}

            <div className="hidden xl:flex items-center space-x-2 text-xs border-r border-[#D4A24C]/20 pr-4">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                <span className="text-[11px] font-medium text-[#F5EFE0]">Live Feeds</span>
              </span>
              <span className="text-[11px] text-[#B9AF95]">· {currentProfile.assignedConstituency.split("(")[0]}</span>
            </div>

            <div
              onClick={() => onProductChange("governance")}
              className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-[#142B45] border border-[#D4A24C]/25 rounded-lg hover:border-[#D4A24C]/60 transition-colors cursor-pointer"
              title="Switch active user role"
            >
              <img
                src={currentProfile.avatar}
                alt={currentProfile.name}
                className="w-6 h-6 rounded-full object-cover border border-[#D4A24C]/40"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#F5EFE0] leading-none">
                  {currentProfile.name.split(" ")[0]}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#D4A24C] mt-0.5">
                  {currentProfile.role.replace("_", " ")}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#D4A24C]" />
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="lg:hidden flex items-center space-x-2 overflow-x-auto py-2 border-t border-[#22405E] no-scrollbar text-xs">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="whitespace-nowrap px-2.5 py-1 rounded font-semibold text-[#D4A24C] bg-[#0F2338] border border-[#D4A24C]/30"
            >
              Overview
            </button>
          )}
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
