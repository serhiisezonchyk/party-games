import type { TranslationKey } from "@/i18n/translations";

export type ParticipantGender = "male" | "female" | "nonBinary";

export interface Participant {
  gender: ParticipantGender;
  id: string;
  name: string;
}

export interface SavedCompany {
  createdAt: string;
  id: string;
  participants: Participant[];
  updatedAt: string;
}

export type MafiaVariant = "classic" | "expanded";

export interface MafiaSettings {
  doctorCount: number;
  hasDon: boolean;
  homelessCount: number;
  mafiaCount: number;
  maniacCount: number;
  prostituteCount: number;
  sheriffCount: number;
  speechDurationSec: number;
  variant: MafiaVariant;
  version: 1;
}

export interface MafiaRecommendation {
  settings: MafiaSettings;
  warningKey?: TranslationKey;
}

export interface MafiaRoleRule {
  descriptionKey: TranslationKey;
  titleKey: TranslationKey;
}

export type MafiaRole =
  | "civilian"
  | "mafia"
  | "don"
  | "sheriff"
  | "doctor"
  | "prostitute"
  | "homeless"
  | "maniac";

export type MafiaGamePhase =
  | "roleReveal"
  | "leaderHandoff"
  | "night"
  | "day"
  | "voting"
  | "tieSpeech"
  | "ended";

export type MafiaEliminationReason = "night" | "vote";

export type MafiaWinner = "mafia" | "civilians";

export interface MafiaPlayerState {
  eliminatedReason?: MafiaEliminationReason;
  isAlive: boolean;
  participant: Participant;
  role: MafiaRole;
}

export type MafiaNightActionKey =
  | "mafiaTargetId"
  | "donTargetId"
  | "doctorTargetId"
  | "prostituteTargetId"
  | "sheriffTargetId"
  | "homelessTargetId"
  | "maniacTargetId";

export type MafiaNightActions = Partial<Record<MafiaNightActionKey, string>>;

export type MafiaScriptAction =
  | "mafiaTargetId"
  | "donTargetId"
  | "doctorTargetId"
  | "prostituteTargetId"
  | "sheriffTargetId"
  | "homelessTargetId"
  | "maniacTargetId";

export type MafiaDynamicScriptText =
  | "mafiaTargetSummary"
  | "doctorTargetSummary"
  | "prostituteTargetSummary"
  | "donResultSummary"
  | "sheriffResultSummary"
  | "homelessResultSummary"
  | "maniacTargetSummary"
  | "mafiaOutcomeSummary"
  | "maniacOutcomeSummary"
  | "nightOutcomeSummary";

export interface MafiaScriptStep {
  action?: MafiaScriptAction;
  dynamicText?: MafiaDynamicScriptText;
  resultType?: "don" | "sheriff" | "homeless";
  textKey?: TranslationKey;
}

export interface MafiaActiveGame {
  createdAt: string;
  daySpeakerIndex: number;
  endedAt?: string;
  id: string;
  leader: Participant;
  nightActions: MafiaNightActions;
  nominations: Record<string, string>;
  phase: MafiaGamePhase;
  players: MafiaPlayerState[];
  revealIndex: number;
  round: number;
  scriptIndex: number;
  settings: MafiaSettings;
  tiedCandidateIds: string[];
  tieSpeakerIndex: number;
  version: 1;
  votes: Record<string, number>;
  votingCandidateIds: string[];
  winner?: MafiaWinner;
}
