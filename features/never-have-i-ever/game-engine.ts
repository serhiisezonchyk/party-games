import type { Participant } from "@/features/mafia/types";
import { getNeverHaveIEverPromptsForCategories } from "@/features/never-have-i-ever/content";
import { getNamedNeverHaveIEverParticipants } from "@/features/never-have-i-ever/defaults";
import type {
  NeverHaveIEverActiveGame,
  NeverHaveIEverSettings,
} from "@/features/never-have-i-ever/types";

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

export function createNeverHaveIEverId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getNeverHaveIEverSipCount(random = Math.random) {
  return Math.floor(random() * 5) + 1;
}

function getPromptIds(settings: NeverHaveIEverSettings) {
  return getNeverHaveIEverPromptsForCategories(
    settings.selectedCategoryIds
  ).map((prompt) => prompt.id);
}

function drawPrompt(game: NeverHaveIEverActiveGame, random = Math.random) {
  let deckCursor = game.promptDeckCursor;
  let deckPromptIds = game.promptIds;

  if (deckPromptIds.length === 0) {
    return null;
  }

  if (deckCursor >= deckPromptIds.length) {
    deckPromptIds = shuffle(deckPromptIds, random);
    deckCursor = 0;
  }

  const promptId = deckPromptIds[deckCursor];

  if (!promptId) {
    return null;
  }

  return {
    deckCursor: deckCursor + 1,
    deckPromptIds,
    promptId,
  };
}

export function createNeverHaveIEverActiveGame({
  participants,
  random = Math.random,
  settings,
}: {
  participants: Participant[];
  random?: () => number;
  settings: NeverHaveIEverSettings;
}): NeverHaveIEverActiveGame | null {
  const players = getNamedNeverHaveIEverParticipants(participants);
  const promptIds = getPromptIds(settings);

  if (players.length < 2 || promptIds.length === 0) {
    return null;
  }

  return {
    version: 1,
    id: createNeverHaveIEverId("never-have-i-ever-game"),
    createdAt: new Date().toISOString(),
    currentPlayerIndex: 0,
    players,
    promptDeckCursor: 0,
    promptIds: shuffle(promptIds, random),
    settings,
  };
}

export function revealNeverHaveIEverPrompt(
  game: NeverHaveIEverActiveGame,
  random = Math.random
): NeverHaveIEverActiveGame {
  const drawnPrompt = drawPrompt(game, random);

  if (!drawnPrompt) {
    return game;
  }

  return {
    ...game,
    currentCard: {
      promptId: drawnPrompt.promptId,
      revealedAt: new Date().toISOString(),
      sipCount: game.settings.alcoholModeEnabled
        ? getNeverHaveIEverSipCount(random)
        : undefined,
    },
    promptDeckCursor: drawnPrompt.deckCursor,
    promptIds: drawnPrompt.deckPromptIds,
  };
}

export function advanceNeverHaveIEverPlayer(
  game: NeverHaveIEverActiveGame,
  random = Math.random
): NeverHaveIEverActiveGame {
  const nextGame = {
    ...game,
    currentCard: undefined,
    currentPlayerIndex: (game.currentPlayerIndex + 1) % game.players.length,
  };

  return revealNeverHaveIEverPrompt(nextGame, random);
}
