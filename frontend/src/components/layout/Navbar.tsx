import React, { useState, useEffect, useRef } from "react";
import { UserProfile, FieldNotification } from "../../types";
import { LeadersLogo } from "../common/LeadersLogo";
import { usePartyTheme } from "../../context/PartyThemeContext";
import { NotificationCenter } from "../fieldops/NotificationCenter";
import { EditProfileModal } from "../common/EditProfileModal";
import { politicalApiService } from "../../services/api";
import { setTicketIdInHash } from "../../utils/ticketHash";
import { isPiOperatorUser, isSmAUser, isSmMUser } from "../../utils/piAccess";
import {
  Shield,
  ArrowLeft,
  Users2,
  ChevronDown,
  LogOut,
  UserCheck,
  Bell,
  ClipboardList,
  Edit3,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";

interface NavbarProps {
  activeProduct: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance" | "contacts" | "assigntickets" | "intel";
  onProductChange: (product: "fieldops" | "pitch" | "grievances" | "volunteers" | "webbuilder" | "governance" | "contacts" | "assigntickets" | "intel") => void;
  isAuditView?: boolean;
  onResetToSelect?: () => void;
  currentProfile: UserProfile;
  onSwitchProfile?: (profile: UserProfile) => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
  onOpenRoleModal?: () => void;
  onGoHome?: () => void;
  onSignOut?: () => void;
}

const navBtn = (active: boolean) =>
  `whitespace-nowrap shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all cursor-pointer ${
    active
      ? "bg-gradient-to-r from-[#D97724] to-[#C99738] text-[#0B131E] shadow-md font-bold"
      : "text-[#CBD5E1] hover:text-[#F5EFE0] hover:bg-[#131E2D]"
  }`;

export const Navbar: React.FC<NavbarProps> = ({
  activeProduct = "fieldops",
  onProductChange,
  isAuditView = false,
  onResetToSelect,
  currentProfile,
  onUpdateProfile,
  onSignOut
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { currentParty, partyName, partyLogo, partySymbolEmoji, isPartyThemeActive } = usePartyTheme();

  const isPiUser = isPiOperatorUser(currentProfile);
  const primaryRole = currentProfile.primaryRole || (
    currentProfile.email === "admin" || currentProfile.email === "admin@leaderslens.ai" || currentProfile.roleId === "SUPER_ADMIN" || currentProfile.role === "super_admin" || currentProfile.isPlatformAdmin
      ? "SUPER_ADMIN"
      : currentProfile.roleId === "ADMIN" || currentProfile.role === "admin" || currentProfile.isPoliticalAdmin
      ? "POLITICAL_ADMIN"
      : currentProfile.roleId === "VOLUNTEER" || currentProfile.role === "volunteer"
      ? "VOLUNTEER"
      : isSmAUser(currentProfile)
      ? "SM_A"
      : isSmMUser(currentProfile)
      ? "SM_M"
      : "DIRECTOR"
  );

  const isPlatformAdmin = !isPiUser && (currentProfile.email === "admin" || currentProfile.email === "admin@leaderslens.ai" || (primaryRole === "SUPER_ADMIN" && !!currentProfile.isPlatformAdmin));
  const isPoliticalAdmin = !isPlatformAdmin && !isPiUser && (primaryRole === "POLITICAL_ADMIN" || !!currentProfile.isPoliticalAdmin);
  const isDirector = !isPlatformAdmin && !isPoliticalAdmin && !isPiUser && (primaryRole === "DIRECTOR" || currentProfile.roleId === "CAMPAIGN_MANAGER" || currentProfile.role === "campaign_manager" || currentProfile.roleId === "PARTY_ADMIN");
  const isVolunteer = !isPlatformAdmin && !isPoliticalAdmin && !isDirector && !isPiUser && (primaryRole === "VOLUNTEER" || currentProfile.roleId === "VOLUNTEER" || currentProfile.role === "volunteer");

  useEffect(() => {
    setLogoError(false);
  }, [partyLogo]);

  useEffect(() => {
    loadUnreadNotifications();
    const interval = setInterval(loadUnreadNotifications, 45000);
    return () => clearInterval(interval);
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

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const syncNavHeight = () => {
      document.documentElement.style.setProperty("--ll-nav-h", `${el.offsetHeight}px`);
    };
    syncNavHeight();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncNavHeight) : null;
    ro?.observe(el);
    window.addEventListener("resize", syncNavHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", syncNavHeight);
    };
  }, [isNotifOpen]);

  const brandSubtitle = isPiUser ? "Political Intelligence" : "Command Portal";

  return (
    <>
    <header
      ref={headerRef}
      data-testid="global-navbar"
      className="sticky top-0 z-40 w-full bg-[#0B1A2C]/95 backdrop-blur-xl border-b border-[#D4A24C]/20 transition-all no-print overflow-visible"
    >
      <div className="w-full px-3 sm:px-4 lg:px-5">
        <div className="flex flex-nowrap items-center gap-2 h-16 min-h-[64px] max-h-16">
          {/* Left Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              data-testid="brand-home"
              className="flex items-center space-x-3 cursor-pointer group shrink-0"
              onClick={() => {
                if (isPiUser) {
                  window.location.hash = "#/intel";
                  onProductChange("intel");
                  return;
                }
                window.location.hash = "#/field-ops";
                onProductChange("fieldops");
                if (onResetToSelect) onResetToSelect();
              }}
              title={isPiUser ? "Political Intelligence" : "Constituency Intelligence Workspace"}
            >
              <div className="relative w-9 h-9 flex-shrink-0 rounded-[6px] overflow-hidden group-hover:brightness-110 transition-all flex items-center justify-center bg-[#071322] border border-[#D4A24C]/40 shadow-sm">
                <LeadersLogo size={36} />
              </div>
              <div className="flex flex-col shrink-0">
                <span className="font-display text-[18px] sm:text-[22px] tracking-[-0.01em] text-[#D4A24C] leading-none whitespace-nowrap">
                  Leaders Lens
                </span>
                <span className="text-[9px] sm:text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[var(--party-primary)] mt-1 flex items-center gap-1.5 whitespace-nowrap">
                  {isPartyThemeActive && partyName ? (
                    <>
                      <span>{partySymbolEmoji || "🏛️"} {partyName}</span>
                      <span className="text-[#8A8E9B]">· {brandSubtitle}</span>
                    </>
                  ) : (
                    brandSubtitle
                  )}
                </span>
              </div>
            </div>

            {isAuditView && onResetToSelect && activeProduct === "pitch" && (
              <button
                onClick={onResetToSelect}
                className="inline-flex items-center text-xs font-medium text-[#D4A24C] hover:text-[#F5EFE0] py-1 px-2.5 rounded bg-[#0F2338] border border-[#D4A24C]/30 hover:border-[#D4A24C]/80 transition-colors shrink-0 whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Change Constituency
              </button>
            )}
          </div>

          <nav data-testid="global-nav" className="flex flex-1 flex-nowrap items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
            {isPiUser && (
            <button
              onClick={() => {
                window.location.hash = "#/intel";
                onProductChange("intel");
              }}
              className={navBtn(activeProduct === "intel")}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Political Intelligence</span>
            </button>
            )}
            {!isPiUser && isPlatformAdmin && (
            <button
              onClick={() => {
                window.location.hash = "#/field-ops";
                onProductChange("fieldops");
              }}
              className={navBtn(activeProduct === "fieldops")}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Ground Intake & Issues</span>
            </button>
            )}

            {!isPiUser && isVolunteer && (
            <button
              onClick={() => {
                window.location.hash = "#/field-ops";
                onProductChange("fieldops");
              }}
              className={navBtn(activeProduct === "fieldops")}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span>Home</span>
            </button>
            )}

            {!isPiUser && !isVolunteer && (
            <button
              onClick={() => {
                window.location.hash = "#/assign-tickets?status=ALL";
                onProductChange("assigntickets");
              }}
              className={navBtn(activeProduct === "assigntickets")}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Assign Tickets / Complaints</span>
            </button>
            )}

            {!isPiUser && (
            <button
              onClick={() => {
                window.location.hash = "#/contacts";
                onProductChange("contacts");
              }}
              className={navBtn(activeProduct === "contacts")}
            >
              <Users2 className="w-3.5 h-3.5 shrink-0" />
              <span>Contact Database</span>
            </button>
            )}

            {isPoliticalAdmin && (
              <button
                onClick={() => {
                  window.location.hash = "#/user-management";
                  onProductChange("governance");
                }}
                className={navBtn(activeProduct === "governance")}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Director User Management</span>
              </button>
            )}

            {isPlatformAdmin && (
              <button
                onClick={() => onProductChange("pitch")}
                className={navBtn(activeProduct === "pitch")}
              >
                Pitch / Audit
              </button>
            )}

            {isPlatformAdmin && (
              <button
                onClick={() => onProductChange("grievances")}
                className={navBtn(activeProduct === "grievances")}
              >
                Grievances
              </button>
            )}

            {isPlatformAdmin && (
              <button
                onClick={() => onProductChange("volunteers")}
                className={navBtn(activeProduct === "volunteers")}
              >
                Volunteers
              </button>
            )}

            {isPlatformAdmin && (
              <button
                onClick={() => onProductChange("governance")}
                className={navBtn(activeProduct === "governance")}
              >
                Admin & Users
              </button>
            )}
          </nav>

          <div className="flex flex-nowrap items-center gap-2 shrink-0">
            {!isPiUser && (
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2 rounded-lg bg-[#142B45] border border-[#D4A24C]/25 text-[#D4A24C] hover:border-[#D4A24C]/60 transition-colors cursor-pointer shrink-0"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            )}

            <div className="relative shrink-0" ref={userMenuRef}>
              <div
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex flex-nowrap items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-[#0F2338] border border-[#22405E] hover:border-[#D4A24C]/60 transition-all cursor-pointer shadow-sm whitespace-nowrap"
              >
                {(isPlatformAdmin || isPoliticalAdmin) && currentProfile.avatar && (
                  <img
                    src={currentProfile.avatar}
                    alt={currentProfile.name}
                    className="w-7 h-7 rounded-lg object-cover border border-[#D4A24C]/50 shrink-0"
                  />
                )}
                <div className="flex flex-col text-left shrink-0">
                  <span className="text-xs font-bold text-[#F5EFE0] leading-none whitespace-nowrap">
                    {currentProfile.name.split(" ")[0]}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--party-primary)] mt-0.5 whitespace-nowrap">
                    {primaryRole === "DIRECTOR" ? "MANAGER" : primaryRole === "SM_A" ? "SM A" : primaryRole === "SM_M" ? "SM M" : primaryRole}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#D4A24C] shrink-0 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </div>

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

                  {isPiUser && (
                    <div className="py-1 border-t border-[#1E3A5A] my-1">
                      <div className="px-3 py-1 text-[10px] font-bold text-[#D4A24C] uppercase tracking-wider">
                        Political Operations
                      </div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          window.dispatchEvent(new CustomEvent("pi-tab-change", { detail: "verify" }));
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#D4A24C]" />
                        <span>Verification Queue</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          window.dispatchEvent(new CustomEvent("pi-tab-change", { detail: "import" }));
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#D4A24C]" />
                        <span>Import / Export</span>
                      </button>
                    </div>
                  )}

                  {isPlatformAdmin && (
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

                  {isPlatformAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onProductChange("governance");
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors text-left cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-[#D4A24C]" />
                      <span>Admin User Governance</span>
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

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap shrink-0 text-rose-300 border border-rose-400/30 hover:text-rose-100 hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

    </header>

    {isNotifOpen && (
      <NotificationCenter
        currentUser={currentProfile}
        isOpen={isNotifOpen}
        onUnreadCountChange={(count) => setUnreadCount(count)}
        onSelectIssue={(issueId) => {
          setIsNotifOpen(false);
          loadUnreadNotifications();
          setTicketIdInHash(issueId);
        }}
        onClose={() => {
          setIsNotifOpen(false);
          loadUnreadNotifications();
        }}
      />
    )}

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
    </>
  );
};
