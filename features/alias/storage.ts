import {
  clampAliasSettings,
  createAliasId,
  createDefaultAliasTeams,
  defaultAliasSettings,
} from "@/features/alias/defaults";
import type {
  AliasActiveGame,
  AliasGamePhase,
  AliasParticipant,
  AliasPenaltyMode,
  AliasRoundResult,
  AliasRoundState,
  AliasScoreFloor,
  AliasSettings,
  AliasTeam,
  AliasWordResult,
  AliasWordResultType,
} from "@/features/alias/types";
import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";
import { isRecord } from "@/storage/preferences-storage";

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

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isAliasPenaltyMode(value: unknown): value is AliasPenaltyMode {
  return value === "none" || value === "minusPoint";
}

function isAliasScoreFloor(value: unknown): value is AliasScoreFloor {
  return value === "zero" || value === "negative";
}

function isAliasGamePhase(value: unknown): value is AliasGamePhase {
  return (
    value === "handoff" ||
    value === "round" ||
    value === "summary" ||
    value === "ended"
  );
}

function isAliasWordResultType(value: unknown): value is AliasWordResultType {
  return value === "success" || value === "fail";
}

function parseAliasParticipant(value: unknown): AliasParticipant | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "",
  };
}

function parseAliasTeam(value: unknown): AliasTeam | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  const participants = Array.isArray(value.participants)
    ? value.participants
        .map(parseAliasParticipant)
        .filter((participant): participant is AliasParticipant =>
          Boolean(participant)
        )
    : [];

  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "",
    participants,
  };
}

export function parseAliasTeams(value: unknown): AliasTeam[] {
  if (!Array.isArray(value)) {
    return createDefaultAliasTeams();
  }

  const teams = value
    .map(parseAliasTeam)
    .filter((team): team is AliasTeam => Boolean(team));

  return teams.length >= 2 ? teams : createDefaultAliasTeams();
}

export function parseAliasSettings(value: unknown): AliasSettings {
  if (!isRecord(value)) {
    return clampAliasSettings(defaultAliasSettings);
  }

  return clampAliasSettings({
    version: 1,
    penaltyMode: isAliasPenaltyMode(value.penaltyMode)
      ? value.penaltyMode
      : defaultAliasSettings.penaltyMode,
    scoreFloor: isAliasScoreFloor(value.scoreFloor)
      ? value.scoreFloor
      : defaultAliasSettings.scoreFloor,
    roundDurationSec: parseNumber(
      value.roundDurationSec,
      defaultAliasSettings.roundDurationSec,
      30,
      300
    ),
    targetScore: parseNumber(
      value.targetScore,
      defaultAliasSettings.targetScore,
      10,
      100
    ),
    selectedCategoryIds: parseStringArray(value.selectedCategoryIds),
  });
}

function parseAliasWordResult(
  value: unknown,
  index: number
): AliasWordResult | null {
  if (!(isRecord(value) && typeof value.wordId === "string")) {
    return null;
  }

  if (!isAliasWordResultType(value.result)) {
    return null;
  }

  return {
    id:
      typeof value.id === "string"
        ? value.id
        : createAliasId(`alias-word-result-${index}`),
    result: value.result,
    wordId: value.wordId,
  };
}

function parseAliasWordResults(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseAliasWordResult)
    .filter((wordResult): wordResult is AliasWordResult => Boolean(wordResult));
}

function parseScores(value: unknown, teams: readonly AliasTeam[]) {
  const baseScores = teams.reduce<Record<string, number>>((scores, team) => {
    scores[team.id] = 0;
    return scores;
  }, {});

  if (!isRecord(value)) {
    return baseScores;
  }

  for (const team of teams) {
    const score = value[team.id];

    if (typeof score === "number" && Number.isFinite(score)) {
      baseScores[team.id] = Math.round(score);
    }
  }

  return baseScores;
}

function parseAliasRoundState(value: unknown): AliasRoundState | undefined {
  if (!isRecord(value)) {
    return;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.teamId !== "string" ||
    typeof value.startedAt !== "string"
  ) {
    return;
  }

  return {
    currentWordId:
      typeof value.currentWordId === "string" ? value.currentWordId : undefined,
    id: value.id,
    startedAt: value.startedAt,
    teamId: value.teamId,
    wordResults: parseAliasWordResults(value.wordResults),
  };
}

function parseAliasRoundResult(value: unknown): AliasRoundResult | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.teamId !== "string" ||
    typeof value.startedAt !== "string" ||
    typeof value.endedAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    teamId: value.teamId,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    failCount: parseNumber(value.failCount, 0, 0, 999),
    roundScore: parseNumber(value.roundScore, 0, -999, 999),
    successCount: parseNumber(value.successCount, 0, 0, 999),
    wordResults: parseAliasWordResults(value.wordResults),
  };
}

export function parseAliasActiveGame(value: unknown): AliasActiveGame | null {
  if (!isRecord(value)) {
    return null;
  }

  const teams = parseAliasTeams(value.teams);

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    !Array.isArray(value.deckWordIds) ||
    teams.length < 2
  ) {
    return null;
  }

  const rounds = Array.isArray(value.rounds)
    ? value.rounds
        .map(parseAliasRoundResult)
        .filter((round): round is AliasRoundResult => Boolean(round))
    : [];
  const phase = isAliasGamePhase(value.phase) ? value.phase : "handoff";
  const currentRound = parseAliasRoundState(value.currentRound);

  if ((phase === "round" || phase === "summary") && !currentRound) {
    return null;
  }

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    currentRound,
    currentTeamIndex: parseNumber(
      value.currentTeamIndex,
      0,
      0,
      teams.length - 1
    ),
    deckCursor: parseNumber(value.deckCursor, 0, 0, value.deckWordIds.length),
    deckWordIds: parseStringArray(value.deckWordIds),
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
    phase,
    rounds,
    scores: parseScores(value.scores, teams),
    settings: parseAliasSettings(value.settings),
    teams,
    winnerTeamId:
      typeof value.winnerTeamId === "string" ? value.winnerTeamId : undefined,
  };
}

export function loadAliasTeams() {
  return localStorageService.get(
    storageKeys.aliasTeams,
    createDefaultAliasTeams(),
    parseAliasTeams
  );
}

export async function saveAliasTeams(teams: AliasTeam[]) {
  await localStorageService.set(storageKeys.aliasTeams, teams);
}

export function loadAliasSettings() {
  return localStorageService.get(
    storageKeys.aliasCurrentSettings,
    defaultAliasSettings,
    parseAliasSettings
  );
}

export async function saveAliasSettings(settings: AliasSettings) {
  await localStorageService.set(storageKeys.aliasCurrentSettings, settings);
}

export function loadActiveAliasGame() {
  return localStorageService.get(
    storageKeys.aliasActiveGame,
    null,
    parseAliasActiveGame
  );
}

export async function saveActiveAliasGame(game: AliasActiveGame) {
  await localStorageService.set(storageKeys.aliasActiveGame, game);
}

export async function clearActiveAliasGame() {
  await localStorageService.remove(storageKeys.aliasActiveGame);
}
