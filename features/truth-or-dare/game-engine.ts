import type { Participant } from "@/features/mafia/types";
import { getTruthOrDarePromptsForCategories } from "@/features/truth-or-dare/content";
import { getNamedTruthOrDareParticipants } from "@/features/truth-or-dare/defaults";
import type {
  TruthOrDareActiveGame,
  TruthOrDarePromptType,
  TruthOrDareSettings,
} from "@/features/truth-or-dare/types";

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

export function createTruthOrDareId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPromptIds(
  settings: TruthOrDareSettings,
  type: TruthOrDarePromptType
) {
  return getTruthOrDarePromptsForCategories(
    settings.selectedCategoryIds,
    type
  ).map((prompt) => prompt.id);
}

function drawPrompt(
  game: TruthOrDareActiveGame,
  type: TruthOrDarePromptType,
  random = Math.random
) {
  const promptIds = type === "truth" ? game.truthPromptIds : game.darePromptIds;
  let deckCursor =
    type === "truth" ? game.truthDeckCursor : game.dareDeckCursor;
  let deckPromptIds = promptIds;

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

export function createTruthOrDareActiveGame({
  participants,
  random = Math.random,
  settings,
}: {
  participants: Participant[];
  random?: () => number;
  settings: TruthOrDareSettings;
}): TruthOrDareActiveGame | null {
  const players = getNamedTruthOrDareParticipants(participants);
  const truthPromptIds = getPromptIds(settings, "truth");
  const darePromptIds = getPromptIds(settings, "dare");

  if (
    players.length < 2 ||
    truthPromptIds.length === 0 ||
    darePromptIds.length === 0
  ) {
    return null;
  }

  return {
    version: 1,
    id: createTruthOrDareId("truth-or-dare-game"),
    createdAt: new Date().toISOString(),
    currentPlayerIndex: 0,
    dareDeckCursor: 0,
    darePromptIds: shuffle(darePromptIds, random),
    players,
    settings,
    truthDeckCursor: 0,
    truthPromptIds: shuffle(truthPromptIds, random),
  };
}

export function revealTruthOrDarePrompt(
  game: TruthOrDareActiveGame,
  type: TruthOrDarePromptType,
  random = Math.random
): TruthOrDareActiveGame {
  const drawnPrompt = drawPrompt(game, type, random);

  if (!drawnPrompt) {
    return game;
  }

  return {
    ...game,
    currentCard: {
      promptId: drawnPrompt.promptId,
      revealedAt: new Date().toISOString(),
      type,
    },
    ...(type === "truth"
      ? {
          truthDeckCursor: drawnPrompt.deckCursor,
          truthPromptIds: drawnPrompt.deckPromptIds,
        }
      : {
          dareDeckCursor: drawnPrompt.deckCursor,
          darePromptIds: drawnPrompt.deckPromptIds,
        }),
  };
}

export function rerollTruthOrDarePrompt(
  game: TruthOrDareActiveGame,
  random = Math.random
): TruthOrDareActiveGame {
  if (!game.currentCard) {
    return game;
  }

  return revealTruthOrDarePrompt(game, game.currentCard.type, random);
}

export function advanceTruthOrDarePlayer(
  game: TruthOrDareActiveGame
): TruthOrDareActiveGame {
  return {
    ...game,
    currentCard: undefined,
    currentPlayerIndex: (game.currentPlayerIndex + 1) % game.players.length,
  };
}
