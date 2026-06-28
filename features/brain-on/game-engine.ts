import { getBrainOnQuestionsForCategories } from "@/features/brain-on/content";
import { getNamedBrainOnParticipants } from "@/features/brain-on/defaults";
import type {
  BrainOnActiveGame,
  BrainOnSettings,
} from "@/features/brain-on/types";
import type { Participant } from "@/features/mafia/types";

function shuffle<T>(items: readonly T[], random = Math.random) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    const item = nextItems[index];
    nextItems[index] = nextItems[randomIndex];
    nextItems[randomIndex] = item;
  }

  return nextItems;
}

export function createBrainOnId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getBrainOnPenaltySipCount(random = Math.random) {
  return Math.floor(random() * 3) + 1;
}

function getQuestionIds(settings: BrainOnSettings) {
  return getBrainOnQuestionsForCategories(settings.selectedCategoryIds).map(
    (question) => question.id
  );
}

function drawQuestion(game: BrainOnActiveGame, random = Math.random) {
  let deckCursor = game.questionDeckCursor;
  let deckQuestionIds = game.questionIds;

  if (deckQuestionIds.length === 0) {
    return null;
  }

  if (deckCursor >= deckQuestionIds.length) {
    deckQuestionIds = shuffle(deckQuestionIds, random);
    deckCursor = 0;
  }

  const questionId = deckQuestionIds[deckCursor];

  if (!questionId) {
    return null;
  }

  return {
    deckCursor: deckCursor + 1,
    deckQuestionIds,
    questionId,
  };
}

export function createBrainOnActiveGame({
  participants,
  random = Math.random,
  settings,
}: {
  participants: Participant[];
  random?: () => number;
  settings: BrainOnSettings;
}): BrainOnActiveGame | null {
  const players = getNamedBrainOnParticipants(participants);
  const questionIds = getQuestionIds(settings);

  if (players.length < 2 || questionIds.length === 0) {
    return null;
  }

  return {
    version: 1,
    id: createBrainOnId("brain-on-game"),
    createdAt: new Date().toISOString(),
    currentPlayerIndex: 0,
    players,
    questionDeckCursor: 0,
    questionIds: shuffle(questionIds, random),
    settings,
  };
}

export function revealBrainOnQuestion(
  game: BrainOnActiveGame,
  random = Math.random
): BrainOnActiveGame {
  const drawnQuestion = drawQuestion(game, random);

  if (!drawnQuestion) {
    return game;
  }

  return {
    ...game,
    currentCard: {
      questionId: drawnQuestion.questionId,
      revealedAt: new Date().toISOString(),
      penaltySipCount: game.settings.alcoholModeEnabled
        ? getBrainOnPenaltySipCount(random)
        : undefined,
    },
    questionDeckCursor: drawnQuestion.deckCursor,
    questionIds: drawnQuestion.deckQuestionIds,
  };
}

export function advanceBrainOnPlayer(
  game: BrainOnActiveGame,
  random = Math.random
): BrainOnActiveGame {
  const nextGame = {
    ...game,
    currentCard: undefined,
    currentPlayerIndex: (game.currentPlayerIndex + 1) % game.players.length,
  };

  return revealBrainOnQuestion(nextGame, random);
}
