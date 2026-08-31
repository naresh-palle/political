import React, { useState, useEffect, useRef } from "react";
import { UserProfile, FieldNotification } from "../../types";
import { LeadersLogo } from "../common/LeadersLogo";
import { usePartyTheme } from "../../context/PartyThemeContext";
import { NotificationCenter } from "../fieldops/NotificationCenter";
import { EditProfileModal } from "../common/EditProfileModal";
import { politicalApiService } from "../../services/api";
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
  UserCheck,
  Bell,
  MapPin,
  ClipboardList,
  Edit3
} from "lucide-react";

interface NavbarProps {
  activeProduct: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance";
  onProductChange: (product: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance") => void;
  isAuditView?: boolean;
  onResetToSelect?: () => void;
  currentProfile: UserProfile;
  onSwitchProfile?: (profile: UserProfile) => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
  onOpenRoleModal?: () => void;
  onGoHome?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProduct = "fieldops",
  onProductChange,
  isAuditView = false,
  onResetToSelect,
  currentProfile,
  onSwitchProfile,
  onUpdateProfile,
  onOpenRoleModal,
  onGoHome,
  onSignOut
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { currentParty, partyName, partyLogo, partySymbolEmoji, isPartyThemeActive } = usePartyTheme();

  const primaryRole = currentProfile.primaryRole || (
    currentProfile.email === "admin@leaderslens.ai" || currentProfile.roleId === "SUPER_ADMIN" || currentProfile.role === "super_admin" || currentProfile.isPlatformAdmin
      ? "SUPER_ADMIN"
      : currentProfile.roleId === "ADMIN" || currentProfile.role === "admin" || currentProfile.isPoliticalAdmin
      ? "POLITICAL_ADMIN"
      : currentProfile.roleId === "VOLUNTEER" || currentProfile.role === "volunteer"
      ? "VOLUNTEER"
      : "DIRECTOR"
  );

  const isPlatformAdmin = currentProfile.email === "admin@leaderslens.ai" || (primaryRole === "SUPER_ADMIN" && !!currentProfile.isPlatformAdmin);
  const isPoliticalAdmin = !isPlatformAdmin && (primaryRole === "POLITICAL_ADMIN" || !!currentProfile.isPoliticalAdmin);
  const isDirector = !isPlatformAdmin && !isPoliticalAdmin && (primaryRole === "DIRECTOR" || currentProfile.roleId === "CAMPAIGN_MANAGER" || currentProfile.role === "campaign_manager" || currentProfile.roleId === "PARTY_ADMIN");
  const isVolunteer = !isPlatformAdmin && !isPoliticalAdmin && !isDirector && (primaryRole === "VOLUNTEER" || currentProfile.roleId === "VOLUNTEER");
  const isAdmin = isPlatformAdmin || isPoliticalAdmin || isDirector;

  useEffect(() => {
    setLogoError(false);
  }, [partyLogo]);

  useEffect(() => {
    loadUnreadNotifications();
  }, [currentProfile.id, currentProfile.primaryRole]);

  const loadUnreadNotifications = async () => {
    try {
      const notifs = await politicalApiService.getFieldNotifications(currentProfile.id, primaryRole);
      setUnreadCount(notifs.filter((n: FieldNotification) => !n.isRead).length);
    } catch (e) {
      console.error(e);
    }
  };

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
          <div className="flex items-center space-x-5 min-w-0">
            <div
              data-testid="brand-home"
              className="flex items-center space-x-3 cursor-pointer group min-w-0"
              onClick={() => {
                onProductChange("fieldops");
                if (onResetToSelect) onResetToSelect();
              }}
              title="Constituency Intelligence Workspace"
            >
              {/* Permanent Leader's Lens Official Company Logo */}
              <div className="relative w-9 h-9 flex-shrink-0 rounded-[6px] overflow-hidden group-hover:brightness-110 transition-all flex items-center justify-center bg-[#071322] border border-[#D4A24C]/40 shadow-sm">
                <LeadersLogo size={36} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display text-[18px] sm:text-[22px] tracking-[-0.01em] text-[#F5EFE0] leading-none truncate">
                  Leader's<span className="italic gold-text"> Lens</span>
                </span>
                <span className="text-[9px] sm:text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[var(--party-primary)] mt-1 flex items-center gap-1.5 truncate">
                  {isPartyThemeActive && partyName ? (
                    <>
                      <span>{partySymbolEmoji || "🏛️"} {partyName}</span>
                      <span className="text-[#8A8E9B] hidden sm:inline">· Command Portal</span>
                    </>
                  ) : (
                    "Political Intelligence"
                  )}
                </span>
              </div>
            </div>

            {/* Back button if in audit */}
            {isAuditView && onResetToSelect && activeProduct === "pitch" && (
              <button
                onClick={onResetToSelect}
                className="hidden sm:inline-flex items-center text-xs font-medium text-[#D4A24C] hover:text-[#F5EFE0] py-1 px-2.5 rounded bg-[#0F2338] border border-[#D4A24C]/30 hover:border-[#D4A24C]/80 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Change Constituency
              </button>
            )}
          </div>

          {/* Center Navigation Products */}
          <nav data-testid="global-nav" className="hidden lg:flex items-center space-x-1">
            {/* Primary Field Operations / Ground Intake Tab */}
            <button
              onClick={() => onProductChange("fieldops")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeProduct === "fieldops"
                  ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                  : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {isVolunteer ? "Ground Intake & Issues" : isDirector ? "Field Operations" : "Field Operations"}
            </button>

            {/* Pitch / Audit (Platform Super Admin ONLY) */}
            {isPlatformAdmin && (
              <button
                onClick={() => onProductChange("pitch")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeProduct === "pitch"
                    ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                    : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
                }`}
              >
                Pitch / Audit
              </button>
            )}

            {/* Grievances Tab (Hidden for Volunteer) */}
            {!isVolunteer && (
              <button
                onClick={() => onProductChange("grievances")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeProduct === "grievances"
                    ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                    : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
                }`}
              >
                Grievances
              </button>
            )}

            {/* Volunteers & Web Studio (Platform Super Admin ONLY) */}
            {isPlatformAdmin && (
              <>
                <button
                  onClick={() => onProductChange("volunteers")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    activeProduct === "volunteers"
                      ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                      : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
                  }`}
                >
                  Volunteers
                </button>
                <button
                  onClick={() => onProductChange("webbuilder")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    activeProduct === "webbuilder"
                      ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                      : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
                  }`}
                >
                  Web Studio
                </button>
              </>
            )}

            {/* User Management / Governance (Platform Admin, Political Admin, and Director) */}
            {(isPlatformAdmin || isPoliticalAdmin || isDirector) && (
              <button
                onClick={() => onProductChange("governance")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeProduct === "governance"
                    ? "bg-[var(--party-primary)] text-[#0B1A2C] shadow-sm font-bold"
                    : "text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45]"
                }`}
              >
                {isPlatformAdmin ? "Admin & Users" : "User Management"}
              </button>
            )}
          </nav>

          {/* Right Meta, Notifications & User Persona */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-lg bg-[#142B45] border border-[#D4A24C]/25 text-[#D4A24C] hover:border-[#D4A24C]/60 transition-colors cursor-pointer"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-[#142B45] border border-[#D4A24C]/25 rounded-lg hover:border-[#D4A24C]/60 transition-colors cursor-pointer"
                title="User profile menu"
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
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--party-primary)] mt-0.5">
                    {primaryRole}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#D4A24C] transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0D2137] border border-[#D4A24C]/30 shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="p-2.5 border-b border-[#1E3A5A] mb-1">
                    <div className="text-xs font-bold text-[#F5EFE0]">{currentProfile.name}</div>
                    <div className="text-[11px] text-[#B9AF95] truncate">{currentProfile.email}</div>
                    {isPartyThemeActive && partyName && (
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-[var(--party-primary)]">
                        <span>{partySymbolEmoji || "🏛️"}</span>
                        <span>{partyName}</span>
                      </div>
                    )}
                    <div className="mt-1.5 inline-flex items-center text-[10px] font-semibold text-[#D4A24C] bg-[#071322] px-2 py-0.5 rounded border border-[#D4A24C]/30">
                      <Shield className="w-3 h-3 mr-1 text-[#D4A24C]" />
                      {currentProfile.clearanceLevel}
                    </div>
                  </div>

                  {/* Edit Profile Action - ONLY for Political Admin and Super Admin */}
                  {(isPoliticalAdmin || isPlatformAdmin) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#D4A24C] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-[#D4A24C]" />
                      <span>Edit Profile (Photo, Email, Phone)</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onProductChange("governance");
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-[#D4A24C]" />
                      <span>{isPlatformAdmin ? "Admin User Governance" : isPoliticalAdmin ? "Directors User Management" : "Squad Volunteers Management"}</span>
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
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-[#22405E] no-scrollbar text-xs -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            onClick={() => onProductChange("fieldops")}
            className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeProduct === "fieldops" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
            }`}
          >
            {isVolunteer ? "Ground Intake & Issues" : "Field Ops"}
          </button>

          {isPlatformAdmin && (
            <button
              onClick={() => onProductChange("pitch")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeProduct === "pitch" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
              }`}
            >
              Audit
            </button>
          )}

          {!isVolunteer && (
            <button
              onClick={() => onProductChange("grievances")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeProduct === "grievances" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
              }`}
            >
              Grievances
            </button>
          )}

          {isPlatformAdmin && (
            <>
              <button
                onClick={() => onProductChange("volunteers")}
                className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeProduct === "volunteers" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
                }`}
              >
                Volunteers
              </button>
              <button
                onClick={() => onProductChange("webbuilder")}
                className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeProduct === "webbuilder" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
                }`}
              >
                Web Studio
              </button>
            </>
          )}

          {(isPlatformAdmin || isPoliticalAdmin || isDirector) && (
            <button
              onClick={() => onProductChange("governance")}
              className={`whitespace-nowrap flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeProduct === "governance" ? "bg-[#D4A24C] text-[#0B1A2C]" : "text-[#B9AF95] hover:text-white"
              }`}
            >
              {isPlatformAdmin ? "Admin & Users" : "User Management"}
            </button>
          )}
        </div>
      </div>

      {/* Notification Center Modal */}
      {isNotifOpen && (
        <NotificationCenter
          currentUser={currentProfile}
          isOpen={isNotifOpen}
          onUnreadCountChange={(count) => setUnreadCount(count)}
          onClose={() => {
            setIsNotifOpen(false);
            loadUnreadNotifications();
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <EditProfileModal
          currentUser={currentProfile}
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onSave={(updated) => {
            if (onUpdateProfile) {
              onUpdateProfile(updated);
            }
          }}
        />
      )}
    </header>
  );
};
