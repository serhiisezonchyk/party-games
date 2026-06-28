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
  getNeverHaveIEverPromptById,
  getNeverHaveIEverPromptCounts,
  neverHaveIEverPrompts,
} = require("../features/never-have-i-ever/content.ts");
const {
  defaultNeverHaveIEverSettings,
  neverHaveIEverCategoryIds,
} = require("../features/never-have-i-ever/defaults.ts");
const {
  advanceNeverHaveIEverPlayer,
  createNeverHaveIEverActiveGame,
  getNeverHaveIEverSipCount,
  revealNeverHaveIEverPrompt,
} = require("../features/never-have-i-ever/game-engine.ts");

const promptIdPattern = /^(lite|medium|adult)-\d{3}$/;
const expectedPromptCounts = {
  adult: 298,
  lite: 145,
  medium: 145,
};

function assertLocalizedText(value, label) {
  assert.equal(typeof value.en, "string", `${label}.en must be a string`);
  assert.equal(typeof value.uk, "string", `${label}.uk must be a string`);
  assert.ok(value.en.trim().length > 0, `${label}.en must not be empty`);
  assert.ok(value.uk.trim().length > 0, `${label}.uk must not be empty`);
}

function testContentCompleteness() {
  const expectedTotal = Object.values(expectedPromptCounts).reduce(
    (total, count) => total + count,
    0
  );

  assert.equal(neverHaveIEverPrompts.length, expectedTotal);

  for (const categoryId of neverHaveIEverCategoryIds) {
    const counts = getNeverHaveIEverPromptCounts(categoryId);

    assert.equal(
      counts.total,
      expectedPromptCounts[categoryId],
      `${categoryId} prompt count changed`
    );
  }
}

function testIdsAndLookups() {
  const ids = neverHaveIEverPrompts.map((prompt) => prompt.id);

  assert.equal(new Set(ids).size, ids.length);

  for (const prompt of neverHaveIEverPrompts) {
    assert.match(prompt.id, promptIdPattern);
    assert.equal(getNeverHaveIEverPromptById(prompt.id), prompt);
    assert.ok(neverHaveIEverCategoryIds.includes(prompt.categoryId));
  }
}

function normalizePromptText(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function testNoDuplicatePromptText() {
  const seenPromptText = new Map();

  for (const prompt of neverHaveIEverPrompts) {
    const normalizedText = normalizePromptText(prompt.text.en);
    const previousPromptId = seenPromptText.get(normalizedText);

    assert.equal(
      previousPromptId,
      undefined,
      `${prompt.id} duplicates English text from ${previousPromptId}`
    );

    seenPromptText.set(normalizedText, prompt.id);
  }
}

function testTextCompleteness() {
  for (const prompt of neverHaveIEverPrompts) {
    assertLocalizedText(prompt.text, `${prompt.id}.text`);
    assert.notEqual(
      prompt.text.en,
      prompt.text.uk,
      `${prompt.id} must have separate English and Ukrainian text`
    );
    assert.ok(
      !/[А-Яа-яЁёІіЇїЄєҐґ]/.test(prompt.text.en),
      `${prompt.id}.en must be English text`
    );
    assert.ok(
      /[А-Яа-яІіЇїЄєҐґ]/.test(prompt.text.uk),
      `${prompt.id}.uk must be Ukrainian text`
    );
    assert.ok(
      !prompt.text.en.toLowerCase().startsWith("never have i ever"),
      `${prompt.id} should store only card completion text in English`
    );
    assert.ok(
      !prompt.text.uk.toLowerCase().startsWith("я ніколи не"),
      `${prompt.id} should store only card completion text in Ukrainian`
    );
    assert.ok(
      !/^(я|никогда|меня|мне|у меня)\s+никогда/i.test(prompt.text.en),
      `${prompt.id} should store only card completion text`
    );
  }
}

function testGameEngine() {
  const game = createNeverHaveIEverActiveGame({
    participants: [
      { id: "player-1", gender: "female", name: "Anna" },
      { id: "player-2", gender: "male", name: "Max" },
      { id: "player-3", gender: "nonBinary", name: " " },
    ],
    random: () => 0,
    settings: {
      ...defaultNeverHaveIEverSettings,
      alcoholModeEnabled: true,
      selectedCategoryIds: ["lite"],
    },
  });

  assert.ok(game, "game should be created from valid setup");
  assert.equal(game.players.length, 2);
  assert.equal(game.currentPlayerIndex, 0);
  assert.equal(game.currentCard, undefined);

  const revealedGame = revealNeverHaveIEverPrompt(game, () => 0);

  assert.ok(revealedGame.currentCard);
  assert.equal(revealedGame.currentCard.sipCount, 1);
  assert.equal(revealedGame.promptDeckCursor, 1);

  const nextPlayerGame = advanceNeverHaveIEverPlayer(revealedGame, () => 0.99);

  assert.equal(nextPlayerGame.currentPlayerIndex, 1);
  assert.ok(nextPlayerGame.currentCard);
  assert.equal(nextPlayerGame.currentCard.sipCount, 5);

  assert.equal(getNeverHaveIEverSipCount(() => 0), 1);
  assert.equal(getNeverHaveIEverSipCount(() => 0.999), 5);
}

testContentCompleteness();
testIdsAndLookups();
testNoDuplicatePromptText();
testTextCompleteness();
testGameEngine();

console.log("Never Have I Ever content checks passed.");
