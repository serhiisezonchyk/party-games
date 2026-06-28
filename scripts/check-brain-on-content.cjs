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
  brainOnQuestions,
  getBrainOnQuestionById,
  getBrainOnQuestionCounts,
} = require("../features/brain-on/content.ts");
const {
  brainOnCategoryIds,
  defaultBrainOnSettings,
} = require("../features/brain-on/defaults.ts");
const {
  advanceBrainOnPlayer,
  createBrainOnActiveGame,
  getBrainOnPenaltySipCount,
  revealBrainOnQuestion,
} = require("../features/brain-on/game-engine.ts");

const expectedQuestionCountByCategory = {
  cars: 12,
  geography: 12,
  history: 12,
  oceans: 12,
  popCulture: 12,
  science: 12,
};
const cyrillicTextPattern = /[А-Яа-яІіЇїЄєҐґ]/;
const questionIdPattern =
  /^(history|oceans|cars|geography|science|popCulture)-\d{3}$/;

function assertLocalizedText(value, label) {
  assert.equal(typeof value.en, "string", `${label}.en must be a string`);
  assert.equal(typeof value.uk, "string", `${label}.uk must be a string`);
  assert.ok(value.en.trim().length > 0, `${label}.en must not be empty`);
  assert.ok(value.uk.trim().length > 0, `${label}.uk must not be empty`);
}

function testContentCompleteness() {
  const expectedTotal = Object.values(expectedQuestionCountByCategory).reduce(
    (total, count) => total + count,
    0
  );

  assert.equal(brainOnQuestions.length, expectedTotal);

  for (const categoryId of brainOnCategoryIds) {
    assert.equal(
      getBrainOnQuestionCounts(categoryId),
      expectedQuestionCountByCategory[categoryId],
      `${categoryId} question count changed`
    );
  }
}

function testIdsAndLookups() {
  const ids = brainOnQuestions.map((question) => question.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const question of brainOnQuestions) {
    assert.match(question.id, questionIdPattern);
    assert.equal(getBrainOnQuestionById(question.id), question);
    assert.ok(brainOnCategoryIds.includes(question.categoryId));
  }
}

function normalizeQuestionText(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function testNoDuplicateQuestionText() {
  const seenQuestionText = new Map();

  for (const question of brainOnQuestions) {
    const normalizedText = normalizeQuestionText(question.question.en);
    const previousQuestionId = seenQuestionText.get(normalizedText);

    assert.equal(
      previousQuestionId,
      undefined,
      `${question.id} duplicates English question from ${previousQuestionId}`
    );

    seenQuestionText.set(normalizedText, question.id);
  }
}

function testTextCompleteness() {
  for (const question of brainOnQuestions) {
    assertLocalizedText(question.question, `${question.id}.question`);
    assertLocalizedText(question.answer, `${question.id}.answer`);
    assert.ok(
      cyrillicTextPattern.test(question.question.uk),
      `${question.id}.question.uk must be Ukrainian text`
    );
  }
}

function testGameEngine() {
  const game = createBrainOnActiveGame({
    participants: [
      { id: "player-1", gender: "female", name: "Anna" },
      { id: "player-2", gender: "male", name: "Max" },
      { id: "player-3", gender: "nonBinary", name: " " },
    ],
    random: () => 0,
    settings: {
      ...defaultBrainOnSettings,
      alcoholModeEnabled: true,
      selectedCategoryIds: ["history"],
    },
  });

  assert.ok(game, "game should be created from valid setup");
  assert.equal(game.players.length, 2);
  assert.equal(game.currentPlayerIndex, 0);
  assert.equal(game.currentCard, undefined);

  const revealedGame = revealBrainOnQuestion(game, () => 0);

  assert.ok(revealedGame.currentCard);
  assert.equal(revealedGame.currentCard.penaltySipCount, 1);
  assert.equal(revealedGame.questionDeckCursor, 1);

  const nextPlayerGame = advanceBrainOnPlayer(revealedGame, () => 0.99);

  assert.equal(nextPlayerGame.currentPlayerIndex, 1);
  assert.ok(nextPlayerGame.currentCard);
  assert.equal(nextPlayerGame.currentCard.penaltySipCount, 3);

  assert.equal(
    getBrainOnPenaltySipCount(() => 0),
    1
  );
  assert.equal(
    getBrainOnPenaltySipCount(() => 0.999),
    3
  );
}

testContentCompleteness();
testIdsAndLookups();
testNoDuplicateQuestionText();
testTextCompleteness();
testGameEngine();

console.log("Brain On content checks passed.");
