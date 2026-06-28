import {
  getTruthOrDarePromptById,
  getTruthOrDarePromptsForCategories,
} from "@/features/truth-or-dare/content";
import {
  clampTruthOrDareSettings,
  defaultTruthOrDareSettings,
  isTruthOrDareCategoryId,
} from "@/features/truth-or-dare/defaults";
import type {
  TruthOrDareActiveGame,
  TruthOrDareCategoryId,
  TruthOrDarePromptType,
  TruthOrDareRevealedCard,
  TruthOrDareSettings,
} from "@/features/truth-or-dare/types";
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

function parseCategoryIds(value: unknown): TruthOrDareCategoryId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isTruthOrDareCategoryId);
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isTruthOrDarePromptType(
  value: unknown
): value is TruthOrDarePromptType {
  return value === "truth" || value === "dare";
}

function getAllowedPromptIds(
  settings: TruthOrDareSettings,
  type: TruthOrDarePromptType
) {
  return getTruthOrDarePromptsForCategories(
    settings.selectedCategoryIds,
    type
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
  truthPromptIds: readonly string[],
  darePromptIds: readonly string[]
): TruthOrDareRevealedCard | undefined {
  if (
    !(
      isRecord(value) &&
      typeof value.promptId === "string" &&
      typeof value.revealedAt === "string" &&
      isTruthOrDarePromptType(value.type)
    )
  ) {
    return;
  }

  const prompt = getTruthOrDarePromptById(value.promptId);
  const promptIds = value.type === "truth" ? truthPromptIds : darePromptIds;

  if (!(prompt?.type === value.type && promptIds.includes(value.promptId))) {
    return;
  }

  return {
    promptId: value.promptId,
    revealedAt: value.revealedAt,
    type: value.type,
  };
}

export function parseTruthOrDareSettings(
  value: unknown,
  isAdult: boolean
): TruthOrDareSettings {
  if (!isRecord(value)) {
    return clampTruthOrDareSettings(defaultTruthOrDareSettings, isAdult);
  }

  return clampTruthOrDareSettings(
    {
      version: 1,
      alcoholModeEnabled: value.alcoholModeEnabled === true,
      selectedCategoryIds: parseCategoryIds(value.selectedCategoryIds),
    },
    isAdult
  );
}

export function parseTruthOrDareActiveGame(
  value: unknown,
  isAdult: boolean
): TruthOrDareActiveGame | null {
  if (!isRecord(value)) {
    return null;
  }

  const settings = parseTruthOrDareSettings(value.settings, isAdult);
  const allowedTruthPromptIds = getAllowedPromptIds(settings, "truth");
  const allowedDarePromptIds = getAllowedPromptIds(settings, "dare");
  const players = parseParticipants(value.players, []);

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    players.length < 2 ||
    allowedTruthPromptIds.length === 0 ||
    allowedDarePromptIds.length === 0
  ) {
    return null;
  }

  const truthPromptIds = parsePromptDeck(
    value.truthPromptIds,
    allowedTruthPromptIds
  );
  const darePromptIds = parsePromptDeck(
    value.darePromptIds,
    allowedDarePromptIds
  );

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    currentCard: parseRevealedCard(
      value.currentCard,
      truthPromptIds,
      darePromptIds
    ),
    currentPlayerIndex: parseNumber(
      value.currentPlayerIndex,
      0,
      0,
      players.length - 1
    ),
    dareDeckCursor: parseNumber(
      value.dareDeckCursor,
      0,
      0,
      darePromptIds.length
    ),
    darePromptIds,
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
    players,
    settings,
    truthDeckCursor: parseNumber(
      value.truthDeckCursor,
      0,
      0,
      truthPromptIds.length
    ),
    truthPromptIds,
  };
}

export function loadTruthOrDareSettings(isAdult: boolean) {
  return localStorageService.get(
    storageKeys.truthOrDareCurrentSettings,
    clampTruthOrDareSettings(defaultTruthOrDareSettings, isAdult),
    (value) => parseTruthOrDareSettings(value, isAdult)
  );
}

export async function saveTruthOrDareSettings(
  settings: TruthOrDareSettings,
  isAdult: boolean
) {
  await localStorageService.set(
    storageKeys.truthOrDareCurrentSettings,
    clampTruthOrDareSettings(settings, isAdult)
  );
}

export function loadActiveTruthOrDareGame(isAdult: boolean) {
  return localStorageService.get(
    storageKeys.truthOrDareActiveGame,
    null,
    (value) => parseTruthOrDareActiveGame(value, isAdult)
  );
}

export async function saveActiveTruthOrDareGame(game: TruthOrDareActiveGame) {
  await localStorageService.set(storageKeys.truthOrDareActiveGame, game);
}

export async function clearActiveTruthOrDareGame() {
  await localStorageService.remove(storageKeys.truthOrDareActiveGame);
}
