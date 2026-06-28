import {
  getBrainOnQuestionById,
  getBrainOnQuestionsForCategories,
} from "@/features/brain-on/content";
import {
  clampBrainOnSettings,
  defaultBrainOnSettings,
  isBrainOnCategoryId,
} from "@/features/brain-on/defaults";
import type {
  BrainOnActiveGame,
  BrainOnCategoryId,
  BrainOnRevealedCard,
  BrainOnSettings,
} from "@/features/brain-on/types";
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

function parseCategoryIds(value: unknown): BrainOnCategoryId[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isBrainOnCategoryId);
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getAllowedQuestionIds(settings: BrainOnSettings) {
  return getBrainOnQuestionsForCategories(settings.selectedCategoryIds).map(
    (question) => question.id
  );
}

function parseQuestionDeck(
  value: unknown,
  allowedQuestionIds: readonly string[]
) {
  const allowedQuestionIdSet = new Set(allowedQuestionIds);
  const questionIds = parseStringArray(value).filter((questionId) =>
    allowedQuestionIdSet.has(questionId)
  );

  return questionIds.length > 0 ? questionIds : [...allowedQuestionIds];
}

function parseRevealedCard(
  value: unknown,
  questionIds: readonly string[]
): BrainOnRevealedCard | undefined {
  if (
    !(
      isRecord(value) &&
      typeof value.questionId === "string" &&
      typeof value.revealedAt === "string"
    )
  ) {
    return;
  }

  const question = getBrainOnQuestionById(value.questionId);

  if (!(question && questionIds.includes(value.questionId))) {
    return;
  }

  return {
    questionId: value.questionId,
    revealedAt: value.revealedAt,
    penaltySipCount:
      typeof value.penaltySipCount === "number"
        ? parseNumber(value.penaltySipCount, 1, 1, 3)
        : undefined,
  };
}

export function parseBrainOnSettings(
  value: unknown,
  isAdult: boolean
): BrainOnSettings {
  if (!isRecord(value)) {
    return clampBrainOnSettings(defaultBrainOnSettings, isAdult);
  }

  return clampBrainOnSettings(
    {
      version: 1,
      alcoholModeEnabled: value.alcoholModeEnabled === true,
      selectedCategoryIds: parseCategoryIds(value.selectedCategoryIds),
    },
    isAdult
  );
}

export function parseBrainOnActiveGame(
  value: unknown,
  isAdult: boolean
): BrainOnActiveGame | null {
  if (!isRecord(value)) {
    return null;
  }

  const settings = parseBrainOnSettings(value.settings, isAdult);
  const allowedQuestionIds = getAllowedQuestionIds(settings);
  const players = parseParticipants(value.players, []);

  if (
    typeof value.id !== "string" ||
    typeof value.createdAt !== "string" ||
    players.length < 2 ||
    allowedQuestionIds.length === 0
  ) {
    return null;
  }

  const questionIds = parseQuestionDeck(value.questionIds, allowedQuestionIds);

  return {
    version: 1,
    id: value.id,
    createdAt: value.createdAt,
    currentCard: parseRevealedCard(value.currentCard, questionIds),
    currentPlayerIndex: parseNumber(
      value.currentPlayerIndex,
      0,
      0,
      players.length - 1
    ),
    endedAt: typeof value.endedAt === "string" ? value.endedAt : undefined,
    players,
    questionDeckCursor: parseNumber(
      value.questionDeckCursor,
      0,
      0,
      questionIds.length
    ),
    questionIds,
    settings,
  };
}

export function loadBrainOnSettings(isAdult: boolean) {
  return localStorageService.get(
    storageKeys.brainOnCurrentSettings,
    clampBrainOnSettings(defaultBrainOnSettings, isAdult),
    (value) => parseBrainOnSettings(value, isAdult)
  );
}

export async function saveBrainOnSettings(
  settings: BrainOnSettings,
  isAdult: boolean
) {
  await localStorageService.set(
    storageKeys.brainOnCurrentSettings,
    clampBrainOnSettings(settings, isAdult)
  );
}

export function loadActiveBrainOnGame(isAdult: boolean) {
  return localStorageService.get(storageKeys.brainOnActiveGame, null, (value) =>
    parseBrainOnActiveGame(value, isAdult)
  );
}

export async function saveActiveBrainOnGame(game: BrainOnActiveGame) {
  await localStorageService.set(storageKeys.brainOnActiveGame, game);
}

export async function clearActiveBrainOnGame() {
  await localStorageService.remove(storageKeys.brainOnActiveGame);
}
