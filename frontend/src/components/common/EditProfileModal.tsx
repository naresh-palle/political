import React, { useState, useRef } from "react";
import { UserProfile } from "../../types";
import {
  X,
  Camera,
  Upload,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Check,
  Shield,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface EditProfileModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

const PRESET_AVATARS = [
  {
    label: "Executive 1 (Corporate / Lead)",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 2 (Senior Command)",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 3 (Political Lead)",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 4 (Public Admin)",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 5 (Field Lead)",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 6 (Constituency Office)",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 7 (Coordinator)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80"
  },
  {
    label: "Executive 8 (Strategist)",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80"
  }
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  const [designation, setDesignation] = useState(currentUser.designation || currentUser.roleTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      email: email.trim().toLowerCase() || currentUser.email,
      phone: phone.trim() || currentUser.phone,
      avatar: avatar.trim() || currentUser.avatar,
      designation: designation.trim() || currentUser.designation,
      roleTitle: designation.trim() || currentUser.roleTitle
    };

    setTimeout(() => {
      onSave(updatedProfile);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#071322]/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-[#0F2338] to-[#0B1A2C] border border-[#D4A24C]/40 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#22405E] bg-[#071322]/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#142B45] border border-[#D4A24C]/40 flex items-center justify-center text-[#D4A24C]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F5EFE0] tracking-wide flex items-center gap-2">
                Edit Executive Profile
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D4A24C]/20 text-[#D4A24C] border border-[#D4A24C]/30">
                  {currentUser.primaryRole || "POLITICAL_ADMIN"}
                </span>
              </h2>
              <p className="text-[11.5px] text-[#B9AF95]">
                Update your official display photo, email address, and mobile hotline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#B9AF95] hover:text-[#F5EFE0] hover:bg-[#142B45] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 no-scrollbar">
          {/* Avatar Edit Section */}
          <div className="p-4 rounded-xl bg-[#071322]/80 border border-[#22405E] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A24C] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Profile Picture
              </span>
              <span className="text-[10.5px] text-[#8E9CAE]">Recommended: Square JPG/PNG</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Image Preview with overlay button */}
              <div className="relative group flex-shrink-0">
                <img
                  src={avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80"}
                  alt={name}
                  onError={() => setPreviewError(true)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#D4A24C] shadow-lg bg-[#142B45]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                  title="Upload from device"
                >
                  <Upload className="w-4 h-4 mb-0.5 text-[#D4A24C]" />
                  Change
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Upload Controls & URL input */}
              <div className="flex-1 w-full space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#B9AF95] mb-1">
                    Image URL or Upload Local Photo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => {
                        setAvatar(e.target.value);
                        setPreviewError(false);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-[#0B1A2C] border border-[#22405E] focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C] rounded-lg px-3 py-2 text-xs text-[#F5EFE0] placeholder-[#5F6875] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-2 bg-[#142B45] hover:bg-[#1E3A5A] border border-[#D4A24C]/40 text-[#D4A24C] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      Browse
                    </button>
                  </div>
                </div>

                {/* Preset Avatars Picker */}
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-semibold text-[#8E9CAE] mb-1.5">
                    Or select a professional executive avatar:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(preset.url);
                          setPreviewError(false);
                        }}
                        className={`relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          avatar === preset.url
                            ? "border-[#D4A24C] ring-2 ring-[#D4A24C]/50 scale-105"
                            : "border-[#22405E] hover:border-[#D4A24C]/60"
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        {avatar === preset.url && (
                          <div className="absolute inset-0 bg-[#D4A24C]/30 flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#071322] font-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B9AF95]">
                <User className="w-3.5 h-3.5 text-[#D4A24C]" />
                Official Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. R. Madhavi Reddy (MLA) or Demo Admin"
                className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B9AF95]">
                <Mail className="w-3.5 h-3.5 text-[#D4A24C]" />
                Official Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo.admin@leaderslens.ai"
                className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
            </div>

            {/* Mobile / Phone Number */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B9AF95]">
                <Phone className="w-3.5 h-3.5 text-[#D4A24C]" />
                Mobile / Office Hotline
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98850 44001"
                className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
            </div>

            {/* Designation / Role Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#B9AF95]">
                <Building2 className="w-3.5 h-3.5 text-[#D4A24C]" />
                Designation / Role Title
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Poddutur Constituency Political Admin (MLA Office)"
                className="w-full bg-[#071322] border border-[#22405E] focus:border-[#D4A24C] focus:ring-1 focus:ring-[#D4A24C] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#F5EFE0] placeholder-[#5F6875] outline-none"
              />
            </div>
          </div>

          {/* Assigned Constituency Notice */}
          <div className="p-3 rounded-xl bg-[#142B45]/50 border border-[#22405E] flex items-center justify-between text-xs text-[#8E9CAE]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4A24C]" />
              <span>Assigned Jurisdiction:</span>
              <strong className="text-[#F5EFE0]">{currentUser.assignedConstituency || "Poddutur AC (AC-139)"}</strong>
            </div>
            <span className="text-[10.5px] font-mono text-[#D4A24C] bg-[#071322] px-2 py-0.5 rounded border border-[#D4A24C]/20">
              {currentUser.clearanceLevel || "LEVEL 4 — COMMAND"}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#22405E]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#B9AF95] hover:text-white hover:bg-[#142B45] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#E07A1F] to-[#D4A24C] text-[#071322] hover:brightness-110 shadow-[0_4px_20px_-4px_rgba(224,122,31,0.6)] transition-all cursor-pointer disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Saved Successfully!
                </>
              ) : isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
