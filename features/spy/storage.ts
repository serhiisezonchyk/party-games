import type { Participant } from "@/features/mafia/types";
import {
  clampSpySettings,
  createDefaultSpyParticipants,
  defaultSpyCustomContent,
  defaultSpySettings,
  getAvailableSpyPackageIds,
} from "@/features/spy/defaults";
import type {
  CustomSpyPackage,
  CustomSpyPlace,
  CustomSpyRole,
  SpyActiveGame,
  SpyActivePlace,
  SpyCustomContent,
  SpyGamePhase,
  SpyPlayerState,
  SpySettings,
} from "@/features/spy/types";
import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";
import { parseParticipant } from "@/storage/participants-storage";
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

function parseCustomRole(value: unknown): CustomSpyRole | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    id: value.id,
    name,
  };
}

function parseCustomPlace(value: unknown): CustomSpyPlace | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    id: value.id,
    name,
    roles: Array.isArray(value.roles)
      ? value.roles
          .map(parseCustomRole)
          .filter((role): role is CustomSpyRole => Boolean(role))
      : [],
  };
}

function parseRoleAdditions(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, CustomSpyRole[]>>(
    (record, [placeId, roles]) => {
      if (Array.isArray(roles)) {
        const parsedRoles = roles
          .map(parseCustomRole)
          .filter((role): role is CustomSpyRole => Boolean(role));

        if (parsedRoles.length > 0) {
          record[placeId] = parsedRoles;
        }
      }

      return record;
    },
    {}
  );
}

function parseCustomPackage(value: unknown): CustomSpyPackage | null {
  if (!(isRecord(value) && typeof value.id === "string")) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";

  if (!name) {
    return null;
  }

  return {
    id: value.id,
    name,
    roleAdditions: parseRoleAdditions(value.roleAdditions),
    items: Array.isArray(value.items)
      ? value.items
          .map(parseCustomPlace)
          .filter((item): item is CustomSpyPlace => Boolean(item))
      : [],
  };
}

function isSpyGamePhase(value: unknown): value is SpyGamePhase {
  return value === "cardReveal" || value === "timer" || value === "ended";
}

function parseActivePlace(value: unknown): SpyActivePlace | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.packageId !== "string" ||
    typeof value.packageName !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    packageId: value.packageId,
    packageName: value.packageName,
    name: value.name,
  };
}

function parseSpyPlayerState(value: unknown): SpyPlayerState | null {
  if (!isRecord(value)) {
    return null;
  }

  const participant = parseParticipant(value.participant);

  if (!participant || typeof value.isSpy !== "boolean") {
    return null;
  }

  return {
    participant,
    isSpy: value.isSpy,
    placeName:
      typeof value.placeName === "string" ? value.placeName : undefined,
    roleName: typeof value.roleName === "string" ? value.roleName : undefined,
  };
}

export function parseSpyCustomContent(value: unknown): SpyCustomContent {
  if (!(isRecord(value) && Array.isArray(value.packages))) {
    return defaultSpyCustomContent;
  }

  return {
    version: 1,
    hiddenPackageIds: parseStringArray(value.hiddenPackageIds),
    hiddenPlaceIds: parseStringArray(value.hiddenPlaceIds),
    hiddenRoleIds: parseStringArray(value.hiddenRoleIds),
    packages: value.packages
      .map(parseCustomPackage)
      .filter((contentPackage): contentPackage is CustomSpyPackage =>
        Boolean(contentPackage)
      ),
  };
}

export function parseSpySettings(
  value: unknown,
  customContent = defaultSpyCustomContent,
  playerCount = 0
): SpySettings {
  if (!isRecord(value)) {
    return clampSpySettings(
      defaultSpySettings,
      playerCount,
      getAvailableSpyPackageIds(customContent)
    );
  }

  return clampSpySettings(
    {
      version: 1,
      spyCount: parseNumber(value.spyCount, defaultSpySettings.spyCount, 1, 99),
      durationSec: parseNumber(
        value.durationSec,
        defaultSpySettings.durationSec,
        60,
        3600
      ),
      selectedPackageIds: parseStringArray(value.selectedPackageIds),
      showRoles:
        typeof value.showRoles === "boolean"
          ? value.showRoles
          : defaultSpySettings.showRoles,
    },
    playerCount,
    getAvailableSpyPackageIds(customContent)
  );
}

export function parseActiveSpyGame(value: unknown): SpyActiveGame | null {
  if (!(isRecord(value) && Array.isArray(value.players))) {
    return null;
  }

  const place = parseActivePlace(value.place);
  const players = value.players
    .map(parseSpyPlayerState)
    .filter((player): player is SpyPlayerState => Boolean(player));

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    !place ||
    players.length < 3
  ) {
    return null;
  }

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    phase: isSpyGamePhase(value.phase) ? value.phase : "cardReveal",
    revealIndex: parseNumber(value.revealIndex, 0, 0, players.length),
    settings: parseSpySettings(value.settings),
    place,
    players,
    timerStartedAt:
      typeof value.timerStartedAt === "string"
        ? value.timerStartedAt
        : undefined,
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
  };
}

export function parseSpyParticipants(value: unknown): Participant[] {
  if (!Array.isArray(value)) {
    return createDefaultSpyParticipants();
  }

  const participants = value
    .map(parseParticipant)
    .filter((participant): participant is Participant => Boolean(participant));

  return participants.length > 0
    ? participants
    : createDefaultSpyParticipants();
}

export function loadSpyParticipants() {
  return localStorageService.get(
    storageKeys.spyParticipants,
    createDefaultSpyParticipants(),
    parseSpyParticipants
  );
}

export async function saveSpyParticipants(participants: Participant[]) {
  await localStorageService.set(storageKeys.spyParticipants, participants);
}

export function loadSpyCustomContent() {
  return localStorageService.get(
    storageKeys.spyCustomContent,
    defaultSpyCustomContent,
    parseSpyCustomContent
  );
}

export async function saveSpyCustomContent(customContent: SpyCustomContent) {
  await localStorageService.set(storageKeys.spyCustomContent, customContent);
}

export function loadSpySettings(
  customContent: SpyCustomContent,
  playerCount: number
) {
  return localStorageService.get(
    storageKeys.spyCurrentSettings,
    defaultSpySettings,
    (value) => parseSpySettings(value, customContent, playerCount)
  );
}

export async function saveSpySettings(settings: SpySettings) {
  await localStorageService.set(storageKeys.spyCurrentSettings, settings);
}

export function loadActiveSpyGame() {
  return localStorageService.get(
    storageKeys.spyActiveGame,
    null,
    parseActiveSpyGame
  );
}

export async function saveActiveSpyGame(game: SpyActiveGame) {
  await localStorageService.set(storageKeys.spyActiveGame, game);
}

export async function clearActiveSpyGame() {
  await localStorageService.remove(storageKeys.spyActiveGame);
}
