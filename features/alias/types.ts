import type { Language } from "@/i18n/translations";

export interface LocalizedText {
  en: string;
  uk: string;
}

export interface AliasWord {
  id: string;
  text: LocalizedText;
}

export interface AliasCategory {
  id: string;
  label: LocalizedText;
  words: AliasWord[];
}

export interface AliasPackage {
  categories: AliasCategory[];
  id: string;
  label: LocalizedText;
}

export interface AliasParticipant {
  id: string;
  name: string;
}

export interface AliasTeam {
  id: string;
  name: string;
  participants: AliasParticipant[];
}

export type AliasPenaltyMode = "none" | "minusPoint";
export type AliasScoreFloor = "zero" | "negative";

export interface AliasSettings {
  penaltyMode: AliasPenaltyMode;
  roundDurationSec: number;
  scoreFloor: AliasScoreFloor;
  selectedCategoryIds: string[];
  targetScore: number;
  version: 1;
}

export type AliasGamePhase = "handoff" | "round" | "summary" | "ended";
export type AliasWordResultType = "success" | "fail";

export interface AliasWordResult {
  id: string;
  result: AliasWordResultType;
  wordId: string;
}

export interface AliasRoundState {
  currentWordId?: string;
  id: string;
  startedAt: string;
  teamId: string;
  wordResults: AliasWordResult[];
}

export interface AliasRoundResult {
  endedAt: string;
  failCount: number;
  id: string;
  roundScore: number;
  startedAt: string;
  successCount: number;
  teamId: string;
  wordResults: AliasWordResult[];
}

export interface AliasActiveGame {
  createdAt: string;
  currentRound?: AliasRoundState;
  currentTeamIndex: number;
  deckCursor: number;
  deckWordIds: string[];
  endedAt?: string;
  id: string;
  phase: AliasGamePhase;
  rounds: AliasRoundResult[];
  scores: Record<string, number>;
  settings: AliasSettings;
  teams: AliasTeam[];
  version: 1;
  winnerTeamId?: string;
}

export function getLocalizedText(text: LocalizedText, language: Language) {
  return text[language] || text.en;
}
