import { aliasCategoryIds } from "@/features/alias/content";
import type {
  AliasParticipant,
  AliasSettings,
  AliasTeam,
} from "@/features/alias/types";

export const MIN_ALIAS_TEAMS = 2;
export const MIN_ALIAS_PARTICIPANTS_PER_TEAM = 1;

export const defaultAliasSettings: AliasSettings = {
  version: 1,
  roundDurationSec: 60,
  targetScore: 30,
  penaltyMode: "minusPoint",
  scoreFloor: "zero",
  selectedCategoryIds: aliasCategoryIds,
};

export function createAliasId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAliasParticipant(name = ""): AliasParticipant {
  return {
    id: createAliasId("alias-player"),
    name,
  };
}

export function createAliasTeam(name: string): AliasTeam {
  return {
    id: createAliasId("alias-team"),
    name,
    participants: [createAliasParticipant()],
  };
}

export function createDefaultAliasTeams(): AliasTeam[] {
  return [createAliasTeam("Team 1"), createAliasTeam("Team 2")];
}

export function getNamedAliasTeams(teams: AliasTeam[]) {
  return teams
    .map((team) => ({
      ...team,
      name: team.name.trim(),
      participants: team.participants
        .map((participant) => ({
          ...participant,
          name: participant.name.trim(),
        }))
        .filter((participant) => participant.name.length > 0),
    }))
    .filter(
      (team) => team.participants.length >= MIN_ALIAS_PARTICIPANTS_PER_TEAM
    );
}

export function clampAliasSettings(settings: AliasSettings): AliasSettings {
  const selectedCategoryIds = settings.selectedCategoryIds.filter(
    (categoryId) => aliasCategoryIds.includes(categoryId)
  );

  return {
    version: 1,
    penaltyMode:
      settings.penaltyMode === "none"
        ? "none"
        : defaultAliasSettings.penaltyMode,
    scoreFloor:
      settings.scoreFloor === "negative"
        ? "negative"
        : defaultAliasSettings.scoreFloor,
    roundDurationSec: Math.min(
      300,
      Math.max(30, Math.round(settings.roundDurationSec))
    ),
    targetScore: Math.min(100, Math.max(10, Math.round(settings.targetScore))),
    selectedCategoryIds:
      selectedCategoryIds.length > 0 ? selectedCategoryIds : aliasCategoryIds,
  };
}
