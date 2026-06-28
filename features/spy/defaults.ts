import type { Participant } from "@/features/mafia/types";
import { builtinSpyPackageIds } from "@/features/spy/content";
import type { SpyCustomContent, SpySettings } from "@/features/spy/types";

export const MIN_SPY_PLAYERS = 3;

export const defaultSpySettings: SpySettings = {
  version: 1,
  spyCount: 1,
  durationSec: 480,
  selectedPackageIds: builtinSpyPackageIds,
  showRoles: false,
};

export const defaultSpyCustomContent: SpyCustomContent = {
  version: 1,
  hiddenPackageIds: [],
  hiddenPlaceIds: [],
  hiddenRoleIds: [],
  packages: [],
};

export function createSpyParticipant(name = ""): Participant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gender: "male",
    name,
  };
}

export function createDefaultSpyParticipants() {
  return [
    createSpyParticipant(),
    createSpyParticipant(),
    createSpyParticipant(),
  ];
}

export function getMaxSpyCount(playerCount: number) {
  if (playerCount < MIN_SPY_PLAYERS) {
    return 0;
  }

  return Math.floor((playerCount - 1) / 2);
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function getCustomPackageIds(customContent: SpyCustomContent) {
  return customContent.packages
    .filter(
      (contentPackage) => !builtinSpyPackageIds.includes(contentPackage.id)
    )
    .map((contentPackage) => contentPackage.id);
}

export function getAvailableSpyPackageIds(customContent: SpyCustomContent) {
  return [
    ...builtinSpyPackageIds.filter(
      (packageId) => !customContent.hiddenPackageIds.includes(packageId)
    ),
    ...getCustomPackageIds(customContent),
  ];
}

export function clampSpySettings(
  settings: SpySettings,
  playerCount: number,
  packageIds: readonly string[]
): SpySettings {
  const maxSpyCount = getMaxSpyCount(playerCount);
  const selectedPackageIds = settings.selectedPackageIds.filter((packageId) =>
    packageIds.includes(packageId)
  );

  return {
    version: 1,
    spyCount:
      maxSpyCount > 0
        ? clampNumber(settings.spyCount, 1, maxSpyCount)
        : Math.max(1, Math.round(settings.spyCount)),
    durationSec: clampNumber(settings.durationSec, 60, 3600),
    selectedPackageIds:
      selectedPackageIds.length > 0 ? selectedPackageIds : [...packageIds],
    showRoles: settings.showRoles,
  };
}

export function getNamedSpyParticipants(participants: Participant[]) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}
