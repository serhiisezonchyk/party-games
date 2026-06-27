import {
  defaultMafiaSettings,
  MAX_RECENT_COMPANIES,
} from "@/features/mafia/defaults";
import type {
  MafiaActiveGame,
  MafiaEliminationReason,
  MafiaGamePhase,
  MafiaNightActionKey,
  MafiaNightActions,
  MafiaPlayerState,
  MafiaRole,
  MafiaSettings,
  MafiaVariant,
  MafiaWinner,
  Participant,
  ParticipantGender,
  SavedCompany,
} from "@/features/mafia/types";
import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";
import { isRecord } from "@/storage/preferences-storage";

const defaultCompanies: SavedCompany[] = [];

function isParticipantGender(value: unknown): value is ParticipantGender {
  return value === "male" || value === "female" || value === "nonBinary";
}

function isMafiaVariant(value: unknown): value is MafiaVariant {
  return value === "classic" || value === "expanded";
}

function isMafiaRole(value: unknown): value is MafiaRole {
  return (
    value === "civilian" ||
    value === "mafia" ||
    value === "don" ||
    value === "sheriff" ||
    value === "doctor" ||
    value === "prostitute" ||
    value === "homeless" ||
    value === "maniac"
  );
}

function isMafiaGamePhase(value: unknown): value is MafiaGamePhase {
  return (
    value === "roleReveal" ||
    value === "leaderHandoff" ||
    value === "night" ||
    value === "day" ||
    value === "voting" ||
    value === "tieSpeech" ||
    value === "ended"
  );
}

function isEliminationReason(value: unknown): value is MafiaEliminationReason {
  return value === "night" || value === "vote";
}

function isMafiaWinner(value: unknown): value is MafiaWinner {
  return value === "mafia" || value === "civilians";
}

function parseNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseParticipant(value: unknown): Participant | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "",
    gender: isParticipantGender(value.gender) ? value.gender : "male",
  };
}

function parseStringRecord(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (record, [key, recordValue]) => {
      if (typeof recordValue === "string") {
        record[key] = recordValue;
      }

      return record;
    },
    {}
  );
}

function parseNumberRecord(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, number>>(
    (record, [key, recordValue]) => {
      if (typeof recordValue === "number" && Number.isFinite(recordValue)) {
        record[key] = Math.max(0, Math.round(recordValue));
      }

      return record;
    },
    {}
  );
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function parseMafiaPlayerState(value: unknown): MafiaPlayerState | null {
  if (!isRecord(value)) {
    return null;
  }

  const participant = parseParticipant(value.participant);

  if (!(participant && isMafiaRole(value.role))) {
    return null;
  }

  return {
    participant,
    role: value.role,
    isAlive: typeof value.isAlive === "boolean" ? value.isAlive : true,
    eliminatedReason: isEliminationReason(value.eliminatedReason)
      ? value.eliminatedReason
      : undefined,
  };
}

function parseNightActions(value: unknown): MafiaNightActions {
  const record = parseStringRecord(value);
  const allowedKeys: MafiaNightActionKey[] = [
    "mafiaTargetId",
    "donTargetId",
    "doctorTargetId",
    "prostituteTargetId",
    "sheriffTargetId",
    "homelessTargetId",
    "maniacTargetId",
  ];

  return allowedKeys.reduce<MafiaNightActions>((actions, key) => {
    if (record[key]) {
      actions[key] = record[key];
    }

    return actions;
  }, {});
}

function parseCompany(value: unknown): SavedCompany | null {
  if (!(isRecord(value) && Array.isArray(value.participants))) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    participants: value.participants
      .map(parseParticipant)
      .filter((participant): participant is Participant =>
        Boolean(participant)
      ),
  };
}

export function parseRecentCompanies(value: unknown): SavedCompany[] {
  if (!Array.isArray(value)) {
    return defaultCompanies;
  }

  return value
    .map(parseCompany)
    .filter((company): company is SavedCompany => Boolean(company))
    .slice(0, MAX_RECENT_COMPANIES);
}

export function parseMafiaSettings(value: unknown): MafiaSettings {
  if (!isRecord(value)) {
    return defaultMafiaSettings;
  }

  return {
    version: 1,
    variant: isMafiaVariant(value.variant)
      ? value.variant
      : defaultMafiaSettings.variant,
    speechDurationSec: parseNumber(
      value.speechDurationSec,
      defaultMafiaSettings.speechDurationSec,
      15,
      300
    ),
    mafiaCount: parseNumber(
      value.mafiaCount,
      defaultMafiaSettings.mafiaCount,
      1,
      12
    ),
    sheriffCount: parseNumber(
      value.sheriffCount,
      defaultMafiaSettings.sheriffCount,
      0,
      4
    ),
    hasDon:
      typeof value.hasDon === "boolean"
        ? value.hasDon
        : defaultMafiaSettings.hasDon,
    doctorCount: parseNumber(
      value.doctorCount,
      defaultMafiaSettings.doctorCount,
      0,
      4
    ),
    prostituteCount: parseNumber(
      value.prostituteCount,
      defaultMafiaSettings.prostituteCount,
      0,
      4
    ),
    homelessCount: parseNumber(
      value.homelessCount,
      defaultMafiaSettings.homelessCount,
      0,
      4
    ),
    maniacCount: parseNumber(
      value.maniacCount,
      defaultMafiaSettings.maniacCount,
      0,
      4
    ),
  };
}

export function parseActiveMafiaGame(value: unknown): MafiaActiveGame | null {
  if (!(isRecord(value) && Array.isArray(value.players))) {
    return null;
  }

  const leader = parseParticipant(value.leader);
  const players = value.players
    .map(parseMafiaPlayerState)
    .filter((player): player is MafiaPlayerState => Boolean(player));

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    !leader ||
    players.length === 0
  ) {
    return null;
  }

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    round: parseNumber(value.round, 1, 1, 100),
    leader,
    players,
    settings: parseMafiaSettings(value.settings),
    phase: isMafiaGamePhase(value.phase) ? value.phase : "roleReveal",
    revealIndex: parseNumber(value.revealIndex, 0, 0, players.length),
    scriptIndex: parseNumber(value.scriptIndex, 0, 0, 100),
    daySpeakerIndex: parseNumber(value.daySpeakerIndex, 0, 0, players.length),
    tieSpeakerIndex: parseNumber(value.tieSpeakerIndex, 0, 0, players.length),
    nightActions: parseNightActions(value.nightActions),
    nominations: parseStringRecord(value.nominations),
    votingCandidateIds: parseStringArray(value.votingCandidateIds),
    tiedCandidateIds: parseStringArray(value.tiedCandidateIds),
    votes: parseNumberRecord(value.votes),
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
    winner: isMafiaWinner(value.winner) ? value.winner : undefined,
  };
}

function normalizeCompanyParticipants(participants: Participant[]) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}

function getCompanySignature(participants: Participant[]) {
  return normalizeCompanyParticipants(participants)
    .map(
      (participant) => `${participant.name.toLowerCase()}|${participant.gender}`
    )
    .join(">");
}

export function loadRecentCompanies() {
  return localStorageService.get(
    storageKeys.mafiaRecentCompanies,
    defaultCompanies,
    parseRecentCompanies
  );
}

export function saveCurrentCompany(participants: Participant[]) {
  const normalizedParticipants = normalizeCompanyParticipants(participants);
  const signature = getCompanySignature(normalizedParticipants);
  const now = new Date().toISOString();

  return localStorageService.update(
    storageKeys.mafiaRecentCompanies,
    defaultCompanies,
    (companies) => {
      const existingCompany = companies.find(
        (company) => getCompanySignature(company.participants) === signature
      );
      const nextCompany: SavedCompany = {
        id: existingCompany?.id ?? `${Date.now()}`,
        createdAt: existingCompany?.createdAt ?? now,
        updatedAt: now,
        participants: normalizedParticipants,
      };

      return [
        nextCompany,
        ...companies.filter((company) => company.id !== nextCompany.id),
      ].slice(0, MAX_RECENT_COMPANIES);
    },
    parseRecentCompanies
  );
}

export function deleteSavedCompany(companyId: string) {
  return localStorageService.update(
    storageKeys.mafiaRecentCompanies,
    defaultCompanies,
    (companies) => companies.filter((company) => company.id !== companyId),
    parseRecentCompanies
  );
}

export function loadMafiaSettings() {
  return localStorageService.get(
    storageKeys.mafiaCurrentSettings,
    defaultMafiaSettings,
    parseMafiaSettings
  );
}

export async function saveMafiaSettings(settings: MafiaSettings) {
  await localStorageService.set(storageKeys.mafiaCurrentSettings, settings);
}

export function loadActiveMafiaGame() {
  return localStorageService.get(
    storageKeys.mafiaActiveGame,
    null,
    parseActiveMafiaGame
  );
}

export async function saveActiveMafiaGame(game: MafiaActiveGame) {
  await localStorageService.set(storageKeys.mafiaActiveGame, game);
}

export async function clearActiveMafiaGame() {
  await localStorageService.remove(storageKeys.mafiaActiveGame);
}
