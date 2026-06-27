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
  createMafiaActiveGame,
  getDonResultKey,
  getNightScriptSteps,
  getTargetOptions,
  getWinCondition,
} = require("../features/mafia/game-engine.ts");
const { defaultMafiaSettings } = require("../features/mafia/defaults.ts");

function participant(id, name) {
  return {
    gender: "male",
    id,
    name,
  };
}

function createParticipants(count) {
  return Array.from({ length: count }, (_, index) =>
    participant(`p${index}`, index === 0 ? "Leader" : `Player ${index}`)
  );
}

function countRoles(game, roles) {
  return game.players.filter((player) => roles.includes(player.role)).length;
}

function forceRoles(game, roles) {
  assert.equal(
    game.players.length,
    roles.length,
    "test role fixture must match player count"
  );

  return {
    ...game,
    players: game.players.map((player, index) => ({
      ...player,
      role: roles[index],
    })),
  };
}

function testDonCountsInsideMafiaTeam() {
  const game = createMafiaActiveGame(createParticipants(7), {
    ...defaultMafiaSettings,
    hasDon: true,
    mafiaCount: 2,
    sheriffCount: 1,
    variant: "classic",
  });

  assert.equal(game.players.length, 6);
  assert.equal(countRoles(game, ["mafia", "don"]), 2);
  assert.equal(countRoles(game, ["don"]), 1);
  assert.equal(countRoles(game, ["sheriff"]), 1);
  assert.equal(countRoles(game, ["civilian"]), 3);
}

function testDonNightActionAndResult() {
  const game = forceRoles(
    createMafiaActiveGame(createParticipants(7), {
      ...defaultMafiaSettings,
      hasDon: true,
      mafiaCount: 2,
      sheriffCount: 1,
      variant: "classic",
    }),
    ["don", "mafia", "sheriff", "civilian", "civilian", "civilian"]
  );
  const sheriff = game.players.find((player) => player.role === "sheriff");

  assert.ok(
    getNightScriptSteps(game).some((step) => step.action === "donTargetId"),
    "Don should receive a night action when alive"
  );
  assert.equal(
    getDonResultKey(game, sheriff.participant.id),
    "mafia.night.resultSheriff"
  );
}

function testMafiaCanTargetMafiaTeam() {
  const game = forceRoles(
    createMafiaActiveGame(createParticipants(7), {
      ...defaultMafiaSettings,
      hasDon: true,
      mafiaCount: 2,
      sheriffCount: 1,
      variant: "classic",
    }),
    ["don", "mafia", "sheriff", "civilian", "civilian", "civilian"]
  );
  const targetRoles = getTargetOptions(game, "mafiaTargetId").map(
    (player) => player.role
  );

  assert.ok(targetRoles.includes("don"));
  assert.ok(targetRoles.includes("mafia"));
}

function testBlockedAttackUsesGenericNightOutcomeOnly() {
  const game = forceRoles(
    createMafiaActiveGame(createParticipants(8), {
      ...defaultMafiaSettings,
      hasDon: false,
      mafiaCount: 1,
      prostituteCount: 1,
      sheriffCount: 1,
      variant: "expanded",
    }),
    [
      "mafia",
      "prostitute",
      "sheriff",
      "civilian",
      "civilian",
      "civilian",
      "civilian",
    ]
  );
  const mafia = game.players.find((player) => player.role === "mafia");
  const civilian = game.players.find((player) => player.role === "civilian");
  const gameWithBlockedAttack = {
    ...game,
    nightActions: {
      mafiaTargetId: civilian.participant.id,
      prostituteTargetId: mafia.participant.id,
    },
  };
  const dynamicSteps = getNightScriptSteps(gameWithBlockedAttack)
    .map((step) => step.dynamicText)
    .filter(Boolean);

  assert.equal(dynamicSteps.includes("mafiaOutcomeSummary"), false);
  assert.equal(dynamicSteps.includes("nightOutcomeSummary"), true);
}

function testCivilianWinRequiresNoThreats() {
  const game = forceRoles(
    createMafiaActiveGame(createParticipants(8), {
      ...defaultMafiaSettings,
      hasDon: true,
      mafiaCount: 2,
      maniacCount: 1,
      sheriffCount: 1,
      variant: "expanded",
    }),
    ["don", "mafia", "sheriff", "maniac", "civilian", "civilian", "civilian"]
  );
  const resolvedGame = {
    ...game,
    players: game.players.map((player) =>
      ["don", "mafia", "maniac"].includes(player.role)
        ? { ...player, isAlive: false }
        : player
    ),
  };

  assert.equal(getWinCondition(resolvedGame), "civilians");
}

function testMafiaWinsOnParity() {
  const game = forceRoles(
    createMafiaActiveGame(createParticipants(7), {
      ...defaultMafiaSettings,
      hasDon: false,
      mafiaCount: 1,
      sheriffCount: 1,
      variant: "classic",
    }),
    ["mafia", "sheriff", "civilian", "civilian", "civilian", "civilian"]
  );
  const resolvedGame = {
    ...game,
    players: game.players.map((player, index) => ({
      ...player,
      isAlive: index < 2,
    })),
  };

  assert.equal(getWinCondition(resolvedGame), "mafia");
}

testDonCountsInsideMafiaTeam();
testDonNightActionAndResult();
testMafiaCanTargetMafiaTeam();
testBlockedAttackUsesGenericNightOutcomeOnly();
testCivilianWinRequiresNoThreats();
testMafiaWinsOnParity();

console.log("Mafia engine regression checks passed.");
