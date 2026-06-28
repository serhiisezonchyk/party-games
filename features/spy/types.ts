import type { Participant } from "@/features/mafia/types";
import type { Language } from "@/i18n/translations";

export interface LocalizedText {
  en: string;
  uk: string;
}

export interface SpyRole {
  id: string;
  label: LocalizedText;
}

export interface SpyPlace {
  id: string;
  label: LocalizedText;
  roles: SpyRole[];
}

export interface SpyPackage {
  id: string;
  items: SpyPlace[];
  label: LocalizedText;
}

export interface CustomSpyRole {
  id: string;
  name: string;
}

export interface CustomSpyPlace {
  id: string;
  name: string;
  roles: CustomSpyRole[];
}

export interface CustomSpyPackage {
  id: string;
  items: CustomSpyPlace[];
  name: string;
  roleAdditions: Record<string, CustomSpyRole[]>;
}

export interface SpyCustomContent {
  hiddenPackageIds: string[];
  hiddenPlaceIds: string[];
  hiddenRoleIds: string[];
  packages: CustomSpyPackage[];
  version: 1;
}

export interface SpySettings {
  durationSec: number;
  selectedPackageIds: string[];
  showRoles: boolean;
  spyCount: number;
  version: 1;
}

export type SpyContentPackage = SpyPackage | CustomSpyPackage;

export type SpyGamePhase = "cardReveal" | "timer" | "ended";

export interface SpyActivePlace {
  id: string;
  name: string;
  packageId: string;
  packageName: string;
}

export interface SpyPlayerState {
  isSpy: boolean;
  participant: Participant;
  placeName?: string;
  roleName?: string;
}

export interface SpyActiveGame {
  createdAt: string;
  endedAt?: string;
  id: string;
  phase: SpyGamePhase;
  place: SpyActivePlace;
  players: SpyPlayerState[];
  revealIndex: number;
  settings: SpySettings;
  timerStartedAt?: string;
  version: 1;
}

export function getLocalizedText(text: LocalizedText, language: Language) {
  return text[language] || text.en;
}
