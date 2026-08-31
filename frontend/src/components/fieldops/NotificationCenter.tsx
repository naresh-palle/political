import React, { useState, useEffect } from "react";
import { FieldNotification, FieldIssue, UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import { IssueDetailModal } from "./IssueDetailModal";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ExternalLink,
  Check,
  Radio,
  Info,
  Calendar,
  UserCheck,
  Tag,
  ArrowRight
} from "lucide-react";

interface NotificationCenterProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSelectIssue?: (issueId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectIssue
}) => {
  const [notifications, setNotifications] = useState<FieldNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [selectedNotification, setSelectedNotification] = useState<FieldNotification | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<FieldIssue | null>(null);
  const [loadingIssue, setLoadingIssue] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser.id, currentUser.primaryRole]);

  // Global Escape key listener for dismissing modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedIssue) {
          setSelectedIssue(null);
        } else if (selectedNotification) {
          setSelectedNotification(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedNotification, selectedIssue, onClose]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await politicalApiService.getFieldNotifications(
        currentUser.id,
        currentUser.primaryRole
      );
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await politicalApiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) => prev ? { ...prev, isRead: true } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (item: FieldNotification) => {
    // 1. Instantly mark as read
    if (!item.isRead) {
      handleMarkRead(item.id);
    }
    // 2. Open full details popup
    setSelectedNotification({ ...item, isRead: true });
  };

  const handleInspectIssue = async (issueId: string) => {
    if (onSelectIssue) {
      onSelectIssue(issueId);
      setSelectedNotification(null);
      onClose();
      return;
    }

    setLoadingIssue(true);
    try {
      const issues = await politicalApiService.getFieldIssues();
      const found = issues.find((i: FieldIssue) => i.id === issueId);
      if (found) {
        setSelectedIssue(found);
      }
    } catch (err) {
      console.error("Failed to load issue details", err);
    } finally {
      setLoadingIssue(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const n of notifications.filter((x) => !x.isRead)) {
        await politicalApiService.markNotificationRead(n.id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) =>
    filter === "UNREAD" ? !n.isRead : true
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getPriorityIcon = (priority: string, type: string) => {
    if (type === "WORK_OVERDUE" || priority === "URGENT") {
      return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (type === "WORK_COMPLETED") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <Bell className="w-4 h-4 text-[#D4A24C] shrink-0" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "URGENT":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-900/60 text-rose-300 border border-rose-600/40">URGENT</span>;
      case "HIGH":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-900/60 text-amber-300 border border-amber-600/40">HIGH PRIORITY</span>;
      case "MEDIUM":
      case "NORMAL":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-900/60 text-blue-300 border border-blue-600/40">NORMAL</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#142B45] text-[#D8CFB8] border border-[#22405E]">STANDARD</span>;
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-[9999] flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] text-[#F5EFE0] animate-slideInRight overflow-hidden mt-14">
          {/* Header */}
          <div className="p-4 border-b border-[#22405E] bg-[#0F2338] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D4A24C]" />
              <h3 className="font-display text-base font-medium text-[#F5EFE0]">
                Operational Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-[#D4A24C] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                title="Close (Esc)"
                className="text-[#9BA3AF] hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 bg-[#071322] border-b border-[#22405E] flex gap-2 text-[11px]">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                filter === "ALL"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm"
                  : "bg-[#0F2338] text-[#D8CFB8] hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                filter === "UNREAD"
                  ? "bg-[#D4A24C] text-[#071322] shadow-sm"
                  : "bg-[#0F2338] text-[#D8CFB8] hover:text-white"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#8E9CAE]">
                Loading alerts...
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8E9CAE] space-y-2">
                <Bell className="w-6 h-6 text-[#5F6875] mx-auto opacity-50" />
                <p>No {filter === "UNREAD" ? "unread " : ""}notifications at this time.</p>
              </div>
            ) : (
              filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group text-left ${
                    item.isRead
                      ? "bg-[#0F2338]/40 border-[#22405E] opacity-75 hover:opacity-100 hover:border-[#D4A24C]/40 hover:bg-[#142B45]/70"
                      : "bg-gradient-to-r from-[#122A44] to-[#0F2338] border-[#D4A24C]/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[#D4A24C] hover:brightness-105 ring-1 ring-[#D4A24C]/20"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5">
                      {getPriorityIcon(item.priority, item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-[12px] font-bold text-[#F5EFE0] group-hover:text-[#D4A24C] transition-colors truncate">
                            {item.title}
                          </h4>
                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" title="Unread" />
                          )}
                        </div>
                        <span className="text-[10px] text-[#8E9CAE] font-mono shrink-0">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#D8CFB8] mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-[#22405E]/40 flex items-center justify-between gap-2 text-[10.5px]">
                        <span className="text-[#D4A24C] group-hover:underline font-semibold inline-flex items-center gap-1">
                          View details <ArrowRight className="w-3 h-3" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleMarkRead(item.id, e)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                            item.isRead
                              ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/30"
                              : "text-[#D4A24C] hover:text-white bg-[#142B45] hover:bg-[#1E3A5A] border border-[#D4A24C]/30"
                          }`}
                        >
                          {item.isRead ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" /> Read
                            </>
                          ) : (
                            "Mark Read"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Notification Detail Popup Modal */}
      {selectedNotification && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNotification(null);
          }}
        >
          <div className="bg-[#0B1A2C] border-2 border-[#D4A24C] rounded-2xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col text-[#F5EFE0] overflow-hidden">
            {/* Modal Header */}
            <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-[#0F2338] to-[#142B45] border-b border-[#22405E] flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#071322] border border-[#D4A24C]/40 text-[#D4A24C] shrink-0 mt-0.5">
                  {getPriorityIcon(selectedNotification.priority, selectedNotification.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {getPriorityBadge(selectedNotification.priority)}
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#142B45] text-[#D4A24C] border border-[#D4A24C]/30">
                      {selectedNotification.type || "OPERATIONAL_ALERT"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Read
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#F5EFE0] leading-snug">
                    {selectedNotification.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotification(null)}
                title="Close (Esc)"
                className="text-[#9BA3AF] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors shrink-0 cursor-pointer border border-[#22405E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Metadata Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#071322] border border-[#22405E] rounded-xl text-xs">
                <div className="flex items-center gap-2 text-[#8E9CAE]">
                  <Calendar className="w-4 h-4 text-[#D4A24C] shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[#5F6875] font-semibold">Received On</span>
                    <span className="text-[#F5EFE0] font-mono text-[11.5px]">
                      {new Date(selectedNotification.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#8E9CAE]">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-[#5F6875] font-semibold">Target Clearance</span>
                    <span className="text-[#F5EFE0] font-semibold">
                      {selectedNotification.recipientRole || "Field Operations System"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notification Message */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#D4A24C] mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Full Notification Description
                </label>
                <div className="p-4 bg-[#0F2338] border border-[#22405E] rounded-xl text-[13px] text-[#F5EFE0] leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>
              </div>

              {/* Linked Issue Card (if available) */}
              {selectedNotification.issueId && (
                <div className="p-4 bg-gradient-to-r from-[#122A44] to-[#0F2338] border border-[#D4A24C]/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#D4A24C] font-bold">
                      <Tag className="w-3.5 h-3.5" /> Associated Ground Issue
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 font-mono">
                      Ticket #{selectedNotification.issueId}
                    </div>
                    <div className="text-[11px] text-[#8E9CAE] mt-0.5">
                      Ground intake logged with real-time constituency dispatch
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loadingIssue}
                    onClick={() => handleInspectIssue(selectedNotification.issueId!)}
                    className="px-4 py-2 bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] hover:from-[#D26A0F] hover:to-[#C99640] text-[#0B1A2C] text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                  >
                    {loadingIssue ? "Loading..." : "Inspect Ground Issue"}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 p-4 bg-[#071322] border-t border-[#22405E] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#8E9CAE]">
                Press <kbd className="px-1.5 py-0.5 bg-[#142B45] border border-[#22405E] rounded text-[10px] font-mono text-[#D4A24C]">Esc</kbd> to close
              </span>

              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2 rounded-lg bg-[#142B45] hover:bg-[#1E3A5A] text-[#F5EFE0] hover:text-white text-xs font-bold border border-[#22405E] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Issue Detail Modal when opened from notification */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          currentUser={currentUser}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onIssueUpdated={loadNotifications}
        />
      )}
    </>
  );
};
