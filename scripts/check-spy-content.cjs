"use strict";
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const fs = require("node:fs");
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
  builtinSpyPackages,
  getBuiltinSpyPlaceCount,
} = require("../features/spy/content.ts");
const {
  clampSpySettings,
  defaultSpySettings,
  getAvailableSpyPackageIds,
  getMaxSpyCount,
} = require("../features/spy/defaults.ts");
const {
  parseSpyCustomContent,
  parseActiveSpyGame,
  parseSpySettings,
} = require("../features/spy/storage.ts");
const {
  createSpyActiveGame,
  getVisibleSpyPlaces,
} = require("../features/spy/game-engine.ts");

function participant(id, name) {
  return {
    gender: "male",
    id,
    name,
  };
}

function createParticipants(count) {
  return Array.from({ length: count }, (_, index) =>
    participant(`p${index}`, `Player ${index + 1}`)
  );
}

function createRandom(values) {
  let index = 0;

  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

function testSpyCountFormula() {
  assert.equal(getMaxSpyCount(0), 0);
  assert.equal(getMaxSpyCount(2), 0);
  assert.equal(getMaxSpyCount(3), 1);
  assert.equal(getMaxSpyCount(4), 1);
  assert.equal(getMaxSpyCount(5), 2);
  assert.equal(getMaxSpyCount(6), 2);
  assert.equal(getMaxSpyCount(7), 3);
  assert.equal(getMaxSpyCount(8), 3);
  assert.equal(getMaxSpyCount(9), 4);
  assert.equal(getMaxSpyCount(11), 5);
}

function testContentCompleteness() {
  assert.ok(getBuiltinSpyPlaceCount() >= 300);

  for (const contentPackage of builtinSpyPackages) {
    assert.ok(contentPackage.label.en);
    assert.ok(contentPackage.label.uk);
    assert.ok(contentPackage.items.length > 0);

    for (const item of contentPackage.items) {
      assert.ok(item.label.en);
      assert.ok(item.label.uk);
      assert.ok(item.roles.length > 0);

      for (const role of item.roles) {
        assert.ok(role.label.en);
        assert.ok(role.label.uk);
      }
    }
  }
}

function testRolesArePlaceSpecific() {
  const easy = builtinSpyPackages.find(
    (contentPackage) => contentPackage.id === "easy"
  );
  const countries = builtinSpyPackages.find(
    (contentPackage) => contentPackage.id === "countries"
  );
  const transport = builtinSpyPackages.find(
    (contentPackage) => contentPackage.id === "transport"
  );
  const ukraine = builtinSpyPackages.find(
    (contentPackage) => contentPackage.id === "ukraine"
  );
  assert.ok(easy);
  assert.ok(countries);
  assert.ok(transport);
  assert.ok(ukraine);

  assert.equal(easy.label.en, "Easy");
  assert.equal(easy.label.uk, "Легкий");
  assert.ok(easy.items.length >= 50);
  assert.ok(easy.items.every((item) => !item.label.en.includes(" ")));

  const egyptRoles = countries.items[0].roles.map((role) => role.label.en);
  const ukraineCountryRoles = countries.items[1].roles.map(
    (role) => role.label.en
  );
  const car = transport.items.find((item) => item.label.en === "Car");
  const ocean = easy.items.find((item) => item.label.en === "Ocean");
  const casino = easy.items.find((item) => item.label.en === "Casino");
  const carRoles = car.roles.map((role) => role.label.en);
  const oceanRoles = ocean.roles.map((role) => role.label.en);
  const casinoRoles = casino.roles.map((role) => role.label.en);

  assert.notDeepEqual(egyptRoles, ukraineCountryRoles);
  assert.ok(carRoles.includes("Driver: Car"));
  assert.ok(oceanRoles.includes("Lifeguard: Ocean"));
  assert.ok(casinoRoles.includes("Dealer: Casino"));
  assert.ok(
    !carRoles.some((role) => role.toLowerCase().includes("controller"))
  );
  assert.ok(ukraine.items.length >= 45);
}

function testNoPackageLevelRoleSource() {
  const source = fs.readFileSync(
    path.join(projectRoot, "features/spy/content.ts"),
    "utf8"
  );

  assert.equal(source.includes("packageRoleTemplates"), false);
  assert.equal(source.includes("PackageRole"), false);
}

function testHiddenPackagesAreUnavailable() {
  const visiblePackageIds = getAvailableSpyPackageIds({
    version: 1,
    hiddenPackageIds: ["countries"],
    hiddenPlaceIds: [],
    hiddenRoleIds: [],
    packages: [],
  });

  assert.equal(visiblePackageIds.includes("countries"), false);
}

function testActiveGameCreation() {
  const game = createSpyActiveGame({
    customContent: {
      version: 1,
      hiddenPackageIds: [],
      hiddenPlaceIds: [],
      hiddenRoleIds: [],
      packages: [],
    },
    language: "en",
    participants: createParticipants(5),
    random: createRandom([0, 0, 0, 0, 0, 0]),
    settings: {
      ...defaultSpySettings,
      selectedPackageIds: ["countries"],
      showRoles: true,
      spyCount: 2,
    },
  });

  assert.ok(game);
  assert.equal(game.players.length, 5);
  assert.equal(game.players.filter((player) => player.isSpy).length, 2);
  assert.equal(
    new Set(
      game.players
        .filter((player) => !player.isSpy)
        .map((player) => player.placeName)
    ).size,
    1
  );
  assert.ok(
    game.players
      .filter((player) => !player.isSpy)
      .every((player) => player.roleName)
  );
  assert.ok(
    game.players
      .filter((player) => player.isSpy)
      .every((player) => !(player.placeName || player.roleName))
  );
}

function testActiveGameWithoutRoles() {
  const game = createSpyActiveGame({
    customContent: {
      version: 1,
      hiddenPackageIds: [],
      hiddenPlaceIds: [],
      hiddenRoleIds: [],
      packages: [],
    },
    language: "en",
    participants: createParticipants(3),
    random: createRandom([0, 0, 0]),
    settings: {
      ...defaultSpySettings,
      selectedPackageIds: ["countries"],
      showRoles: false,
      spyCount: 1,
    },
  });

  assert.ok(game);
  assert.ok(
    game.players
      .filter((player) => !player.isSpy)
      .every((player) => player.placeName && !player.roleName)
  );
}

function testHiddenContentIsExcludedFromGameCreation() {
  const allPackageIds = builtinSpyPackages.map(
    (contentPackage) => contentPackage.id
  );
  const visiblePlaces = getVisibleSpyPlaces(
    {
      version: 1,
      hiddenPackageIds: ["countries"],
      hiddenPlaceIds: [],
      hiddenRoleIds: [],
      packages: [],
    },
    {
      ...defaultSpySettings,
      selectedPackageIds: ["countries"],
    },
    "en"
  );
  const game = createSpyActiveGame({
    customContent: {
      version: 1,
      hiddenPackageIds: ["countries"],
      hiddenPlaceIds: [],
      hiddenRoleIds: [],
      packages: [],
    },
    language: "en",
    participants: createParticipants(3),
    random: createRandom([0]),
    settings: {
      ...defaultSpySettings,
      selectedPackageIds: ["countries"],
      spyCount: 1,
    },
  });
  const emptyGame = createSpyActiveGame({
    customContent: {
      version: 1,
      hiddenPackageIds: allPackageIds,
      hiddenPlaceIds: [],
      hiddenRoleIds: [],
      packages: [],
    },
    language: "en",
    participants: createParticipants(3),
    random: createRandom([0]),
    settings: {
      ...defaultSpySettings,
      selectedPackageIds: ["countries"],
      spyCount: 1,
    },
  });

  assert.deepEqual(visiblePlaces, []);
  assert.ok(game);
  assert.notEqual(game.place.packageId, "countries");
  assert.equal(emptyGame, null);
}

function testSettingsClamp() {
  const packageIds = builtinSpyPackages.map(
    (contentPackage) => contentPackage.id
  );
  const settings = clampSpySettings(
    {
      ...defaultSpySettings,
      durationSec: 12,
      selectedPackageIds: ["missing"],
      spyCount: 99,
    },
    5,
    packageIds
  );

  assert.equal(settings.durationSec, 60);
  assert.equal(settings.spyCount, 2);
  assert.deepEqual(settings.selectedPackageIds, packageIds);
}

function testStorageParsers() {
  assert.deepEqual(parseSpyCustomContent({ packages: "bad" }), {
    version: 1,
    hiddenPackageIds: [],
    hiddenPlaceIds: [],
    hiddenRoleIds: [],
    packages: [],
  });
  assert.deepEqual(
    parseSpyCustomContent({
      hiddenPackageIds: ["countries", 12],
      hiddenPlaceIds: ["countries-place-1"],
      hiddenRoleIds: ["countries-place-1-role-1"],
      packages: [],
    }),
    {
      version: 1,
      hiddenPackageIds: ["countries"],
      hiddenPlaceIds: ["countries-place-1"],
      hiddenRoleIds: ["countries-place-1-role-1"],
      packages: [],
    }
  );
  assert.equal(
    parseSpySettings(
      { spyCount: 99 },
      {
        version: 1,
        hiddenPackageIds: [],
        hiddenPlaceIds: [],
        hiddenRoleIds: [],
        packages: [],
      },
      3
    ).spyCount,
    1
  );
  assert.equal(parseActiveSpyGame({ players: [] }), null);
  assert.equal(
    parseActiveSpyGame({
      id: "game",
      createdAt: "now",
      phase: "cardReveal",
      revealIndex: 0,
      settings: defaultSpySettings,
      place: {
        id: "place",
        packageId: "pkg",
        packageName: "Package",
        name: "Place",
      },
      players: createParticipants(3).map((item, index) => ({
        participant: item,
        isSpy: index === 0,
      })),
    })?.players.length,
    3
  );
}

testSpyCountFormula();
testContentCompleteness();
testRolesArePlaceSpecific();
testNoPackageLevelRoleSource();
testHiddenPackagesAreUnavailable();
testActiveGameCreation();
testActiveGameWithoutRoles();
testHiddenContentIsExcludedFromGameCreation();
testSettingsClamp();
testStorageParsers();

console.log("Spy content and settings checks passed.");
