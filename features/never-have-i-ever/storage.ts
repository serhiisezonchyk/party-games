import {
  getNeverHaveIEverPromptById,
  getNeverHaveIEverPromptsForCategories,
} from "@/features/never-have-i-ever/content";
import {
  clampNeverHaveIEverSettings,
  defaultNeverHaveIEverSettings,
  isNeverHaveIEverCategoryId,
} from "@/features/never-have-i-ever/defaults";
import type {
  NeverHaveIEverActiveGame,
  NeverHaveIEverCategoryId,
  NeverHaveIEverRevealedCard,
  NeverHaveIEverSettings,
} from "@/features/never-have-i-ever/types";
import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";
import { parseParticipants } from "@/storage/participants-storage";
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

function parseCategoryIds(value: unknown): NeverHaveIEverCategoryId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isNeverHaveIEverCategoryId);
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getAllowedPromptIds(settings: NeverHaveIEverSettings) {
  return getNeverHaveIEverPromptsForCategories(
    settings.selectedCategoryIds
  ).map((prompt) => prompt.id);
}

function parsePromptDeck(value: unknown, allowedPromptIds: readonly string[]) {
  const allowedPromptIdSet = new Set(allowedPromptIds);
  const promptIds = parseStringArray(value).filter((promptId) =>
    allowedPromptIdSet.has(promptId)
  );

  return promptIds.length > 0 ? promptIds : [...allowedPromptIds];
}

function parseRevealedCard(
  value: unknown,
  promptIds: readonly string[]
): NeverHaveIEverRevealedCard | undefined {
  if (
    !(
      isRecord(value) &&
      typeof value.promptId === "string" &&
      typeof value.revealedAt === "string"
    )
  ) {
    return;
  }

  const prompt = getNeverHaveIEverPromptById(value.promptId);

  if (!(prompt && promptIds.includes(value.promptId))) {
    return;
  }

  return {
    promptId: value.promptId,
    revealedAt: value.revealedAt,
    sipCount:
      typeof value.sipCount === "number"
        ? parseNumber(value.sipCount, 1, 1, 5)
        : undefined,
  };
}

export function parseNeverHaveIEverSettings(
  value: unknown,
  isAdult: boolean
): NeverHaveIEverSettings {
  if (!isRecord(value)) {
    return clampNeverHaveIEverSettings(defaultNeverHaveIEverSettings, isAdult);
  }

  return clampNeverHaveIEverSettings(
    {
      version: 1,
      alcoholModeEnabled: value.alcoholModeEnabled === true,
      selectedCategoryIds: parseCategoryIds(value.selectedCategoryIds),
    },
    isAdult
  );
}

export function parseNeverHaveIEverActiveGame(
  value: unknown,
  isAdult: boolean
): NeverHaveIEverActiveGame | null {
  if (!isRecord(value)) {
    return null;
  }

  const settings = parseNeverHaveIEverSettings(value.settings, isAdult);
  const allowedPromptIds = getAllowedPromptIds(settings);
  const players = parseParticipants(value.players, []);

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    players.length < 2 ||
    allowedPromptIds.length === 0
  ) {
    return null;
  }

  const promptIds = parsePromptDeck(value.promptIds, allowedPromptIds);

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    currentCard: parseRevealedCard(value.currentCard, promptIds),
    currentPlayerIndex: parseNumber(
      value.currentPlayerIndex,
      0,
      0,
      players.length - 1
    ),
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
    players,
    promptDeckCursor: parseNumber(
      value.promptDeckCursor,
      0,
      0,
      promptIds.length
    ),
    promptIds,
    settings,
  };
}

export function loadNeverHaveIEverSettings(isAdult: boolean) {
  return localStorageService.get(
    storageKeys.neverHaveIEverCurrentSettings,
    clampNeverHaveIEverSettings(defaultNeverHaveIEverSettings, isAdult),
    (value) => parseNeverHaveIEverSettings(value, isAdult)
  );
}

export async function saveNeverHaveIEverSettings(
  settings: NeverHaveIEverSettings,
  isAdult: boolean
) {
  await localStorageService.set(
    storageKeys.neverHaveIEverCurrentSettings,
    clampNeverHaveIEverSettings(settings, isAdult)
  );
}

export function loadActiveNeverHaveIEverGame(isAdult: boolean) {
  return localStorageService.get(
    storageKeys.neverHaveIEverActiveGame,
    null,
    (value) => parseNeverHaveIEverActiveGame(value, isAdult)
  );
}

export async function saveActiveNeverHaveIEverGame(
  game: NeverHaveIEverActiveGame
) {
  await localStorageService.set(storageKeys.neverHaveIEverActiveGame, game);
}

export async function clearActiveNeverHaveIEverGame() {
  await localStorageService.remove(storageKeys.neverHaveIEverActiveGame);
}
