import React, { useState, useEffect } from "react";
import { FieldNotification, UserProfile } from "../../types";
import { politicalApiService } from "../../services/api";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ExternalLink
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

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser.id, currentUser.primaryRole]);

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

  const handleMarkRead = async (id: string) => {
    try {
      await politicalApiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
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

  const getPriorityIcon = (priority: string, type: string) => {
    if (type === "WORK_OVERDUE" || priority === "URGENT") {
      return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (type === "WORK_COMPLETED") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    return <Bell className="w-4 h-4 text-[#D4A24C] shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] text-[#F5EFE0] animate-slideInRight overflow-hidden mt-14">
        {/* Header */}
        <div className="p-4 border-b border-[#22405E] bg-[#0F2338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D4A24C]" />
            <h3 className="font-display text-base font-medium text-[#F5EFE0]">
              Operational Notifications
            </h3>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-[#D4A24C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <button
              onClick={onClose}
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
            className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              filter === "ALL"
                ? "bg-[#D4A24C] text-[#071322]"
                : "bg-[#0F2338] text-[#D8CFB8] hover:text-white"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("UNREAD")}
            className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
              filter === "UNREAD"
                ? "bg-[#D4A24C] text-[#071322]"
                : "bg-[#0F2338] text-[#D8CFB8] hover:text-white"
            }`}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#8E9CAE]">
              Loading alerts...
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8E9CAE]">
              No {filter === "UNREAD" ? "unread " : ""}notifications at this time.
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) handleMarkRead(item.id);
                  if (item.issueId && onSelectIssue) {
                    onSelectIssue(item.issueId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  item.isRead
                    ? "bg-[#0F2338]/50 border-[#22405E] opacity-75 hover:opacity-100"
                    : "bg-gradient-to-r from-[#122A44] to-[#0F2338] border-[#D4A24C]/40 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {getPriorityIcon(item.priority, item.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[12px] font-semibold text-[#F5EFE0] truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-[#8E9CAE] font-mono shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D8CFB8] mt-1 leading-snug">
                      {item.message}
                    </p>
                    {item.issueId && (
                      <span className="text-[10px] text-[#D4A24C] hover:underline mt-1.5 inline-flex items-center gap-1">
                        View Issue #{item.issueId} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Attribution */}
        <div className="p-2.5 bg-[#071322] border-t border-[#22405E] text-center text-[10px] text-[#8E9CAE]">
          Developed and Maintained by{" "}
          <a
            href="https://plaramai.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#D4A24C] hover:underline font-semibold"
          >
            plaramai.in
          </a>
        </div>
      </div>
    </div>
  );
};
