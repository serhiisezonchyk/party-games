"use strict";

const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(
  request,
  parent,
  isMain,
  options
) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(projectRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = (module, filename) => {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  aliasCategoryIds,
  aliasPackages,
  getAliasWordById,
  getAliasWordCount,
  getAliasWordIdsForCategories,
} = require("../features/alias/content.ts");
const {
  clampAliasSettings,
  defaultAliasSettings,
  getNamedAliasTeams,
} = require("../features/alias/defaults.ts");
const {
  applyAliasRoundScore,
  calculateAliasRoundStats,
  completeAliasRound,
  createAliasActiveGame,
  markAliasWord,
  startAliasRound,
  toggleAliasSummaryResult,
} = require("../features/alias/game-engine.ts");
const {
  parseAliasActiveGame,
  parseAliasSettings,
  parseAliasTeams,
} = require("../features/alias/storage.ts");

function testContentCompleteness() {
  const categoryWordCounts = aliasPackages.flatMap((contentPackage) =>
    contentPackage.categories.map((category) => category.words.length)
  );

  assert.ok(aliasPackages.length >= 8);
  assert.ok(aliasCategoryIds.length >= 18);
  assert.ok(getAliasWordCount() >= 1200);
  assert.ok(new Set(categoryWordCounts).size >= 5);
  assert.ok(categoryWordCounts.includes(57));
  assert.ok(categoryWordCounts.includes(89));
  assert.ok(categoryWordCounts.includes(120));

  for (const contentPackage of aliasPackages) {
    assert.ok(contentPackage.label.en);
    assert.ok(contentPackage.label.uk);
    assert.ok(contentPackage.categories.length > 0);

    for (const category of contentPackage.categories) {
      assert.ok(category.label.en);
      assert.ok(category.label.uk);
      assert.ok(category.words.length >= 30);
      assert.equal(category.isAdultOnly, undefined);
      assert.equal(category.label.en.includes("18+"), false);
      assert.equal(category.label.uk.includes("18+"), false);

      for (const word of category.words) {
        assert.ok(word.id);
        assert.ok(word.text.en);
        assert.ok(word.text.uk);
      }
    }
  }
}

function getWordKey(wordId) {
  const word = getAliasWordById(wordId);

  assert.ok(word);

  return `${word.text.en.trim().toLowerCase()}|${word.text.uk.trim().toLowerCase()}`;
}

function testSelectedWordDeduplication() {
  const selectedWordIds = getAliasWordIdsForCategories(aliasCategoryIds);
  const selectedWordKeys = selectedWordIds.map(getWordKey);

  assert.equal(new Set(selectedWordKeys).size, selectedWordKeys.length);
}

function testSettingsClamp() {
  const safeCategoryId = aliasCategoryIds[0];

  assert.ok(safeCategoryId);

  const clampedSettings = clampAliasSettings({
    version: 1,
    penaltyMode: "none",
    roundDurationSec: 999,
    scoreFloor: "negative",
    targetScore: 1,
    selectedCategoryIds: ["missing", safeCategoryId],
  });

  assert.equal(clampedSettings.selectedCategoryIds.includes("missing"), false);
  assert.equal(
    clampedSettings.selectedCategoryIds.includes(safeCategoryId),
    true
  );
  assert.equal(clampedSettings.roundDurationSec, 300);
  assert.equal(clampedSettings.targetScore, 10);
  assert.equal(clampedSettings.penaltyMode, "none");
  assert.equal(clampedSettings.scoreFloor, "negative");
}

function testParsers() {
  const parsedSettings = parseAliasSettings({
    penaltyMode: "bad",
    roundDurationSec: Number.POSITIVE_INFINITY,
    scoreFloor: "bad",
    selectedCategoryIds: ["missing", aliasCategoryIds[0]],
    targetScore: "bad",
  });

  assert.equal(parsedSettings.penaltyMode, defaultAliasSettings.penaltyMode);
  assert.equal(parsedSettings.scoreFloor, defaultAliasSettings.scoreFloor);
  assert.equal(parsedSettings.selectedCategoryIds.includes("missing"), false);
  assert.equal(
    parsedSettings.selectedCategoryIds.includes(aliasCategoryIds[0]),
    true
  );

  const parsedTeams = parseAliasTeams([
    {
      id: "team-1",
      name: "Alpha",
      participants: [{ id: "p1", name: "Ann" }],
    },
    {
      id: "team-2",
      name: "Beta",
      participants: [{ id: "p2", name: "Bob" }],
    },
  ]);

  assert.equal(getNamedAliasTeams(parsedTeams).length, 2);
  assert.equal(parseAliasTeams("bad").length, 2);
  assert.equal(parseAliasActiveGame("bad"), null);
}

function createAliasTestTeams() {
  return [
    {
      id: "team-1",
      name: "Alpha",
      participants: [{ id: "p1", name: "Ann" }],
    },
    {
      id: "team-2",
      name: "Beta",
      participants: [{ id: "p2", name: "Bob" }],
    },
  ];
}

function createAliasTestSettings(overrides = {}) {
  const safeCategoryId = aliasCategoryIds[0];

  assert.ok(safeCategoryId);

  return {
    ...defaultAliasSettings,
    roundDurationSec: 60,
    scoreFloor: "zero",
    selectedCategoryIds: [safeCategoryId],
    targetScore: 2,
    ...overrides,
  };
}

function testGameCreationAndLastWordFlow() {
  const game = createAliasActiveGame({
    random: () => 0,
    settings: createAliasTestSettings(),
    teams: createAliasTestTeams(),
  });

  assert.ok(game);
  assert.equal(game.teams.length, 2);
  assert.ok(game.deckWordIds.length > 0);
  assert.equal(new Set(game.deckWordIds).size, game.deckWordIds.length);

  const round = startAliasRound(game, () => 0);
  assert.equal(round.phase, "round");
  assert.ok(round.currentRound?.currentWordId);

  const afterSuccess = markAliasWord({
    game: round,
    isTimerDone: false,
    random: () => 0,
    result: "success",
  });
  assert.equal(afterSuccess.phase, "round");
  assert.equal(afterSuccess.currentRound.wordResults.length, 1);
  assert.ok(afterSuccess.currentRound.currentWordId);

  const afterLastWord = markAliasWord({
    game: afterSuccess,
    isTimerDone: true,
    result: "fail",
  });
  assert.equal(afterLastWord.phase, "summary");
  assert.equal(afterLastWord.currentRound.wordResults.length, 2);
  assert.equal(afterLastWord.currentRound.currentWordId, undefined);
}

function testScoringAndSummaryEditing() {
  const settings = createAliasTestSettings({
    penaltyMode: "minusPoint",
    scoreFloor: "zero",
    targetScore: 10,
  });
  const stats = calculateAliasRoundStats(
    [
      { wordId: "w1", result: "success" },
      { wordId: "w2", result: "fail" },
      { wordId: "w3", result: "fail" },
    ],
    settings
  );

  assert.equal(stats.successCount, 1);
  assert.equal(stats.failCount, 2);
  assert.equal(stats.roundScore, -1);
  assert.equal(applyAliasRoundScore(0, -1, settings), 0);
  assert.equal(
    applyAliasRoundScore(0, -1, { ...settings, scoreFloor: "negative" }),
    -1
  );

  const game = createAliasActiveGame({
    random: () => 0,
    settings,
    teams: createAliasTestTeams(),
  });
  assert.ok(game);

  const summary = markAliasWord({
    game: startAliasRound(game, () => 0),
    isTimerDone: true,
    result: "fail",
  });
  assert.equal(summary.phase, "summary");
  assert.equal(
    calculateAliasRoundStats(summary.currentRound.wordResults, settings)
      .roundScore,
    -1
  );

  const edited = toggleAliasSummaryResult(
    summary,
    summary.currentRound.wordResults[0].id
  );
  assert.equal(
    calculateAliasRoundStats(edited.currentRound.wordResults, settings)
      .roundScore,
    1
  );
}

function testWinnerDetection() {
  const game = createAliasActiveGame({
    random: () => 0,
    settings: createAliasTestSettings({ targetScore: 1 }),
    teams: createAliasTestTeams(),
  });
  assert.ok(game);

  const summary = markAliasWord({
    game: startAliasRound(game, () => 0),
    isTimerDone: true,
    result: "success",
  });
  const ended = completeAliasRound(summary);

  assert.equal(ended.phase, "ended");
  assert.equal(ended.winnerTeamId, "team-1");
  assert.equal(ended.scores["team-1"], 1);
}

function testRecentWordsAreDelayedAfterDeckReset() {
  const baseGame = createAliasActiveGame({
    random: () => 0,
    settings: createAliasTestSettings(),
    teams: createAliasTestTeams(),
  });
  assert.ok(baseGame);

  const game = {
    ...baseGame,
    deckCursor: 4,
    deckWordIds: ["fresh-1", "fresh-2", "recent-1", "recent-2"],
    rounds: [
      {
        endedAt: new Date().toISOString(),
        failCount: 0,
        id: "round-1",
        roundScore: 2,
        startedAt: new Date().toISOString(),
        successCount: 2,
        teamId: "team-1",
        wordResults: [
          { id: "result-1", result: "success", wordId: "recent-1" },
          { id: "result-2", result: "success", wordId: "recent-2" },
        ],
      },
    ],
  };
  const nextRound = startAliasRound(game, () => 0);

  assert.equal(nextRound.phase, "round");
  assert.equal(
    ["recent-1", "recent-2"].includes(nextRound.currentRound.currentWordId),
    false
  );
}

testContentCompleteness();
testSelectedWordDeduplication();
testSettingsClamp();
testParsers();
testGameCreationAndLastWordFlow();
testScoringAndSummaryEditing();
testWinnerDetection();
testRecentWordsAreDelayedAfterDeckReset();

console.log("Alias content, settings, and gameplay checks passed.");
