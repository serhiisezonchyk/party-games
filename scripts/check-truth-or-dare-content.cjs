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
  getTruthOrDareAdultCategoryIds,
  getTruthOrDarePromptById,
  getTruthOrDarePromptCounts,
  truthOrDarePrompts,
} = require("../features/truth-or-dare/content.ts");
const {
  defaultTruthOrDareSettings,
  truthOrDareCategoryIds,
} = require("../features/truth-or-dare/defaults.ts");
const {
  advanceTruthOrDarePlayer,
  createTruthOrDareActiveGame,
  rerollTruthOrDarePrompt,
  revealTruthOrDarePrompt,
} = require("../features/truth-or-dare/game-engine.ts");

const onlineOnlyPattern =
  /\b(post online|upload|dm|direct message|tag someone|livestream|stream it|send it online)\b/i;
const dislikedPromptWordingPattern =
  /\b(adult|consent|consenting|agrees)\b|доросл|згод|погодж/i;
const confusingPenaltyPattern = /\bpenalty\s+\d+\b|штраф\s+\d+/i;
const promptIdPattern = /^[a-z0-9-]+-(truth|dare)-\d{3}$/;
const englishAlcoholPenaltyPattern = /^Skip this .+ and take \d sips?\.$/;
const ukrainianAlcoholPenaltyPattern =
  /^Пропусти цю .+ і зроби \d ковт(ок|ки)\.$/;
const adultThemePattern =
  /sex|sexual|body|genitals|pleasure|kink|turn-on|bedroom|touch|kiss|секс|сексуаль|геніталі|задоволення|кінк|збудж|ліжк|дотик|поціл/;

function assertLocalizedText(value, label) {
  assert.equal(typeof value.en, "string", `${label}.en must be a string`);
  assert.equal(typeof value.uk, "string", `${label}.uk must be a string`);
  assert.ok(value.en.trim().length > 0, `${label}.en must not be empty`);
  assert.ok(value.uk.trim().length > 0, `${label}.uk must not be empty`);
}

function testContentCompleteness() {
  const truthCount = truthOrDarePrompts.filter(
    (prompt) => prompt.type === "truth"
  ).length;
  const dareCount = truthOrDarePrompts.filter(
    (prompt) => prompt.type === "dare"
  ).length;

  assert.ok(truthCount >= 1000);
  assert.ok(dareCount >= 1000);
  assert.equal(truthOrDarePrompts.length, truthCount + dareCount);

  for (const categoryId of truthOrDareCategoryIds) {
    const counts = getTruthOrDarePromptCounts(categoryId);

    assert.ok(counts.truths >= 160, `${categoryId} needs at least 160 truths`);
    assert.ok(counts.dares >= 160, `${categoryId} needs at least 160 dares`);
    assert.equal(counts.total, counts.truths + counts.dares);
  }
}

function testIdsAndLookups() {
  const ids = truthOrDarePrompts.map((prompt) => prompt.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const prompt of truthOrDarePrompts) {
    assert.match(prompt.id, promptIdPattern);
    assert.equal(getTruthOrDarePromptById(prompt.id), prompt);
    assert.ok(truthOrDareCategoryIds.includes(prompt.categoryId));
    assert.ok(prompt.type === "truth" || prompt.type === "dare");
  }
}

function testTextCompleteness() {
  for (const prompt of truthOrDarePrompts) {
    assertLocalizedText(prompt.text, `${prompt.id}.text`);
    assertLocalizedText(prompt.alcoholPenalty, `${prompt.id}.alcoholPenalty`);
    assert.ok(
      !onlineOnlyPattern.test(prompt.text.en),
      `${prompt.id} references online-only behavior in English`
    );
    assert.ok(
      !onlineOnlyPattern.test(prompt.text.uk),
      `${prompt.id} references online-only behavior in Ukrainian`
    );
    assert.ok(
      !dislikedPromptWordingPattern.test(prompt.text.en),
      `${prompt.id} uses disliked prompt wording in English`
    );
    assert.ok(
      !dislikedPromptWordingPattern.test(prompt.text.uk),
      `${prompt.id} uses disliked prompt wording in Ukrainian`
    );
    assert.ok(
      !confusingPenaltyPattern.test(prompt.alcoholPenalty.en),
      `${prompt.id} uses indexed penalty wording in English`
    );
    assert.ok(
      !confusingPenaltyPattern.test(prompt.alcoholPenalty.uk),
      `${prompt.id} uses indexed penalty wording in Ukrainian`
    );
    assert.match(prompt.alcoholPenalty.en, englishAlcoholPenaltyPattern);
    assert.match(prompt.alcoholPenalty.uk, ukrainianAlcoholPenaltyPattern);
  }
}

function testAdultCategories() {
  assert.deepEqual(getTruthOrDareAdultCategoryIds(), ["extreme", "18plus"]);

  for (const prompt of truthOrDarePrompts) {
    if (prompt.categoryId === "18plus") {
      const combinedText = `${prompt.text.en} ${prompt.text.uk}`.toLowerCase();

      assert.ok(
        adultThemePattern.test(combinedText),
        `${prompt.id} should be clearly adult-themed`
      );
    }
  }
}

function testGameEngine() {
  const game = createTruthOrDareActiveGame({
    participants: [
      { id: "player-1", gender: "female", name: "Anna" },
      { id: "player-2", gender: "male", name: "Max" },
      { id: "player-3", gender: "nonBinary", name: " " },
    ],
    random: () => 0,
    settings: {
      ...defaultTruthOrDareSettings,
      alcoholModeEnabled: true,
      selectedCategoryIds: ["fun"],
    },
  });

  assert.ok(game, "game should be created from valid setup");
  assert.equal(game.players.length, 2);
  assert.equal(game.currentPlayerIndex, 0);
  assert.equal(game.currentCard, undefined);

  const truthGame = revealTruthOrDarePrompt(game, "truth", () => 0);

  assert.equal(truthGame.currentCard.type, "truth");
  assert.equal(
    getTruthOrDarePromptById(truthGame.currentCard.promptId).type,
    "truth"
  );
  assert.equal(truthGame.truthDeckCursor, 1);

  const rerolledTruthGame = rerollTruthOrDarePrompt(truthGame, () => 0);

  assert.equal(rerolledTruthGame.currentCard.type, "truth");
  assert.equal(
    getTruthOrDarePromptById(rerolledTruthGame.currentCard.promptId).type,
    "truth"
  );
  assert.equal(rerolledTruthGame.truthDeckCursor, 2);

  const nextPlayerGame = advanceTruthOrDarePlayer(rerolledTruthGame);

  assert.equal(nextPlayerGame.currentCard, undefined);
  assert.equal(nextPlayerGame.currentPlayerIndex, 1);
}

testContentCompleteness();
testIdsAndLookups();
testTextCompleteness();
testAdultCategories();
testGameEngine();

console.log("Truth or Dare content checks passed.");
