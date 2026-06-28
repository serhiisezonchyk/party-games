import { getAliasWordIdsForCategories } from "@/features/alias/content";
import { createAliasId, getNamedAliasTeams } from "@/features/alias/defaults";
import type {
  AliasActiveGame,
  AliasRoundResult,
  AliasRoundState,
  AliasSettings,
  AliasTeam,
  AliasWordResult,
  AliasWordResultType,
} from "@/features/alias/types";

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

function createScores(teams: readonly AliasTeam[]) {
  return teams.reduce<Record<string, number>>((scores, team) => {
    scores[team.id] = 0;
    return scores;
  }, {});
}

function getRecentAliasWordIds(
  game: AliasActiveGame,
  currentRound?: AliasRoundState
) {
  const playedWordIds = [
    ...game.rounds.flatMap((round) =>
      round.wordResults.map((wordResult) => wordResult.wordId)
    ),
    ...((currentRound ?? game.currentRound)?.wordResults.map(
      (wordResult) => wordResult.wordId
    ) ?? []),
  ];
  const recentLimit = Math.min(
    80,
    Math.max(12, Math.floor(game.deckWordIds.length * 0.35))
  );

  return playedWordIds.slice(-recentLimit);
}

function shuffleWithRecentWordsLast(
  wordIds: readonly string[],
  recentWordIds: readonly string[],
  random = Math.random
) {
  const recentWordIdSet = new Set(recentWordIds);
  const freshWordIds = wordIds.filter((wordId) => !recentWordIdSet.has(wordId));
  const delayedWordIds = wordIds.filter((wordId) =>
    recentWordIdSet.has(wordId)
  );

  if (freshWordIds.length === 0) {
    return shuffle(wordIds, random);
  }

  return [...shuffle(freshWordIds, random), ...shuffle(delayedWordIds, random)];
}

function drawWord(
  game: AliasActiveGame,
  random = Math.random,
  currentRound?: AliasRoundState
) {
  let deckWordIds = game.deckWordIds;
  let deckCursor = game.deckCursor;

  if (deckCursor >= deckWordIds.length) {
    deckWordIds = shuffleWithRecentWordsLast(
      deckWordIds,
      getRecentAliasWordIds(game, currentRound),
      random
    );
    deckCursor = 0;
  }

  const wordId = deckWordIds[deckCursor];

  if (!wordId) {
    return null;
  }

  return {
    deckCursor: deckCursor + 1,
    deckWordIds,
    wordId,
  };
}

export function calculateAliasRoundStats(
  wordResults: readonly AliasWordResult[],
  settings: AliasSettings
) {
  const successCount = wordResults.filter(
    (wordResult) => wordResult.result === "success"
  ).length;
  const failCount = wordResults.filter(
    (wordResult) => wordResult.result === "fail"
  ).length;
  const roundScore =
    settings.penaltyMode === "minusPoint"
      ? successCount - failCount
      : successCount;

  return {
    failCount,
    roundScore,
    successCount,
  };
}

export function applyAliasRoundScore(
  currentScore: number,
  roundScore: number,
  settings: AliasSettings
) {
  const nextScore = currentScore + roundScore;

  return settings.scoreFloor === "zero" ? Math.max(0, nextScore) : nextScore;
}

export function createAliasActiveGame({
  random = Math.random,
  settings,
  teams,
}: {
  random?: () => number;
  settings: AliasSettings;
  teams: AliasTeam[];
}): AliasActiveGame | null {
  const namedTeams = getNamedAliasTeams(teams);
  const wordIds = getAliasWordIdsForCategories(settings.selectedCategoryIds);

  if (namedTeams.length < 2 || wordIds.length === 0) {
    return null;
  }

  return {
    version: 1,
    id: createAliasId("alias-game"),
    createdAt: new Date().toISOString(),
    currentTeamIndex: 0,
    deckCursor: 0,
    deckWordIds: shuffle(wordIds, random),
    phase: "handoff",
    rounds: [],
    scores: createScores(namedTeams),
    settings,
    teams: namedTeams,
  };
}

export function startAliasRound(
  game: AliasActiveGame,
  random = Math.random
): AliasActiveGame {
  const drawnWord = drawWord(game, random);
  const team = game.teams[game.currentTeamIndex];

  if (!(drawnWord && team)) {
    return game;
  }

  return {
    ...game,
    currentRound: {
      id: createAliasId("alias-round"),
      startedAt: new Date().toISOString(),
      teamId: team.id,
      wordResults: [],
      currentWordId: drawnWord.wordId,
    },
    deckCursor: drawnWord.deckCursor,
    deckWordIds: drawnWord.deckWordIds,
    phase: "round",
  };
}

function finishAliasRound(
  game: AliasActiveGame,
  currentRound: AliasRoundState
): AliasActiveGame {
  return {
    ...game,
    currentRound: {
      ...currentRound,
      currentWordId: undefined,
    },
    phase: "summary",
  };
}

export function markAliasWord({
  game,
  isTimerDone,
  random = Math.random,
  result,
}: {
  game: AliasActiveGame;
  isTimerDone: boolean;
  random?: () => number;
  result: AliasWordResultType;
}): AliasActiveGame {
  if (!(game.phase === "round" && game.currentRound?.currentWordId)) {
    return game;
  }

  const currentRound: AliasRoundState = {
    ...game.currentRound,
    wordResults: [
      ...game.currentRound.wordResults,
      {
        id: createAliasId("alias-word-result"),
        result,
        wordId: game.currentRound.currentWordId,
      },
    ],
  };

  if (isTimerDone) {
    return finishAliasRound(game, currentRound);
  }

  const drawnWord = drawWord(game, random, currentRound);

  if (!drawnWord) {
    return finishAliasRound(game, currentRound);
  }

  return {
    ...game,
    currentRound: {
      ...currentRound,
      currentWordId: drawnWord.wordId,
    },
    deckCursor: drawnWord.deckCursor,
    deckWordIds: drawnWord.deckWordIds,
  };
}

export function toggleAliasSummaryResult(
  game: AliasActiveGame,
  wordResultId: string
): AliasActiveGame {
  if (!(game.phase === "summary" && game.currentRound)) {
    return game;
  }

  return {
    ...game,
    currentRound: {
      ...game.currentRound,
      wordResults: game.currentRound.wordResults.map((wordResult) =>
        wordResult.id === wordResultId
          ? {
              ...wordResult,
              result: wordResult.result === "success" ? "fail" : "success",
            }
          : wordResult
      ),
    },
  };
}

export function completeAliasRound(game: AliasActiveGame): AliasActiveGame {
  if (!(game.phase === "summary" && game.currentRound)) {
    return game;
  }

  const stats = calculateAliasRoundStats(
    game.currentRound.wordResults,
    game.settings
  );
  const teamScore = game.scores[game.currentRound.teamId] ?? 0;
  const nextTeamScore = applyAliasRoundScore(
    teamScore,
    stats.roundScore,
    game.settings
  );
  const nextScores = {
    ...game.scores,
    [game.currentRound.teamId]: nextTeamScore,
  };
  const roundResult: AliasRoundResult = {
    ...stats,
    id: game.currentRound.id,
    startedAt: game.currentRound.startedAt,
    endedAt: new Date().toISOString(),
    teamId: game.currentRound.teamId,
    wordResults: game.currentRound.wordResults,
  };
  const winnerTeamId =
    nextTeamScore >= game.settings.targetScore
      ? game.currentRound.teamId
      : undefined;

  return {
    ...game,
    currentRound: undefined,
    currentTeamIndex: (game.currentTeamIndex + 1) % game.teams.length,
    endedAt: winnerTeamId ? new Date().toISOString() : undefined,
    phase: winnerTeamId ? "ended" : "handoff",
    rounds: [...game.rounds, roundResult],
    scores: nextScores,
    winnerTeamId,
  };
}
