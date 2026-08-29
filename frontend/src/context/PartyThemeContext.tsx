import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { PoliticalParty, UserProfile } from "../types";
import { politicalApiService } from "../services/api";

const NEUTRAL_THEME = {
  primary: "#D4A24C",
  secondary: "#B45309",
  accent: "#E07A1F",
  lightBg: "#0B1A2C",
  darkBg: "#0B1A2C",
  text: "#F5EFE0",
  muted: "#B9AF95",
  gradientStart: "#D4A24C",
  gradientEnd: "#E07A1F"
};

export interface PartyThemeContextValue {
  currentParty: PoliticalParty | null;
  partyName: string | null;
  partyShortName: string | null;
  partyAbbreviation: string | null;
  partyLogo: string | null;
  partySymbolEmoji: string | null;
  partyBackground: string | null;
  partyPrimaryColor: string;
  partySecondaryColor: string;
  partyAccentColor: string;
  isPartyThemeActive: boolean;
  refreshPartyTheme: () => Promise<void>;
  getPartyBranding: (partyId?: string | null) => Promise<PoliticalParty | undefined>;
}

const PartyThemeContext = createContext<PartyThemeContextValue>({
  currentParty: null,
  partyName: null,
  partyShortName: null,
  partyAbbreviation: null,
  partyLogo: null,
  partySymbolEmoji: null,
  partyBackground: null,
  partyPrimaryColor: NEUTRAL_THEME.primary,
  partySecondaryColor: NEUTRAL_THEME.secondary,
  partyAccentColor: NEUTRAL_THEME.accent,
  isPartyThemeActive: false,
  refreshPartyTheme: async () => {},
  getPartyBranding: async () => undefined
});

interface PartyThemeProviderProps {
  authenticatedUser?: UserProfile | null;
  children: React.ReactNode;
}

export const PartyThemeProvider: React.FC<PartyThemeProviderProps> = ({
  authenticatedUser,
  children
}) => {
  const [currentParty, setCurrentParty] = useState<PoliticalParty | null>(null);
  const [partyCache, setPartyCache] = useState<Map<string, PoliticalParty>>(new Map());

  // Apply CSS design tokens to :root and document.body
  const applyThemeTokens = useCallback((tokens: typeof NEUTRAL_THEME) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--party-primary", tokens.primary);
    root.style.setProperty("--party-secondary", tokens.secondary);
    root.style.setProperty("--party-accent", tokens.accent);
    root.style.setProperty("--party-light-bg", tokens.lightBg);
    root.style.setProperty("--party-dark-bg", tokens.darkBg);
    root.style.setProperty("--party-text", tokens.text);
    root.style.setProperty("--party-muted", tokens.muted);
    root.style.setProperty("--party-gradient-start", tokens.gradientStart);
    root.style.setProperty("--party-gradient-end", tokens.gradientEnd);

    if (document.body) {
      document.body.style.backgroundColor = tokens.lightBg;
      document.body.style.color = tokens.text;
    }
  }, []);

  // Fetch single party with caching
  const getPartyBranding = useCallback(
    async (partyId?: string | null): Promise<PoliticalParty | undefined> => {
      if (!partyId) return undefined;
      const cleanId = partyId.trim().toUpperCase();
      if (partyCache.has(cleanId)) {
        return partyCache.get(cleanId);
      }
      try {
        const party = await politicalApiService.getPoliticalPartyById(cleanId);
        if (party) {
          setPartyCache((prev) => new Map(prev).set(cleanId, party));
          return party;
        }
      } catch (err) {
        console.warn(`[PartyTheme] Error fetching party branding for ID: ${cleanId}`, err);
      }
      return undefined;
    },
    [partyCache]
  );

  // Load and apply theme for the currently authenticated user's partyId
  const syncUserPartyTheme = useCallback(async () => {
    if (!authenticatedUser || !authenticatedUser.partyId) {
      // Neutral platform theme
      setCurrentParty(null);
      applyThemeTokens(NEUTRAL_THEME);
      return;
    }

    const party = await getPartyBranding(authenticatedUser.partyId);
    if (party && party.isActive !== false) {
      setCurrentParty(party);
      applyThemeTokens({
        primary: party.primaryColor || NEUTRAL_THEME.primary,
        secondary: party.secondaryColor || party.primaryColor || NEUTRAL_THEME.secondary,
        accent: party.accentColor || party.secondaryColor || NEUTRAL_THEME.accent,
        lightBg: party.lightBackground || NEUTRAL_THEME.lightBg,
        darkBg: party.darkBackground || NEUTRAL_THEME.darkBg,
        text: party.textColor || NEUTRAL_THEME.text,
        muted: party.mutedTextColor || NEUTRAL_THEME.muted,
        gradientStart: party.gradientStart || party.primaryColor || NEUTRAL_THEME.gradientStart,
        gradientEnd: party.gradientEnd || party.secondaryColor || NEUTRAL_THEME.gradientEnd
      });
    } else {
      setCurrentParty(null);
      applyThemeTokens(NEUTRAL_THEME);
    }
  }, [authenticatedUser, getPartyBranding, applyThemeTokens]);

  useEffect(() => {
    syncUserPartyTheme();
  }, [authenticatedUser?.partyId, syncUserPartyTheme]);

  const value = useMemo<PartyThemeContextValue>(() => {
    const isPartyThemeActive = !!currentParty;
    return {
      currentParty,
      partyName: currentParty ? currentParty.name : null,
      partyShortName: currentParty ? (currentParty.shortName || currentParty.name) : null,
      partyAbbreviation: currentParty ? currentParty.abbreviation : null,
      partyLogo: currentParty ? currentParty.logoUrl : null,
      partySymbolEmoji: currentParty ? (currentParty.symbolEmoji || "🏛️") : null,
      partyBackground: currentParty?.backgroundImageUrl || null,
      partyPrimaryColor: currentParty?.primaryColor || NEUTRAL_THEME.primary,
      partySecondaryColor: currentParty?.secondaryColor || NEUTRAL_THEME.secondary,
      partyAccentColor: currentParty?.accentColor || NEUTRAL_THEME.accent,
      isPartyThemeActive,
      refreshPartyTheme: syncUserPartyTheme,
      getPartyBranding
    };
  }, [currentParty, syncUserPartyTheme, getPartyBranding]);

  return <PartyThemeContext.Provider value={value}>{children}</PartyThemeContext.Provider>;
};

export const usePartyTheme = (): PartyThemeContextValue => {
  const context = useContext(PartyThemeContext);
  if (!context) {
    throw new Error("usePartyTheme must be used within a PartyThemeProvider");
  }
  return context;
};
