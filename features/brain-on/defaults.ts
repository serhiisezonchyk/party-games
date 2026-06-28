import type {
  BrainOnCategory,
  BrainOnCategoryId,
  BrainOnSettings,
} from "@/features/brain-on/types";
import type { Participant } from "@/features/mafia/types";

export const MIN_BRAIN_ON_PLAYERS = 2;

export const brainOnCategories: readonly BrainOnCategory[] = [
  {
    id: "history",
    titleKey: "brainOn.category.history",
    descriptionKey: "brainOn.category.historyDescription",
  },
  {
    id: "oceans",
    titleKey: "brainOn.category.oceans",
    descriptionKey: "brainOn.category.oceansDescription",
  },
  {
    id: "cars",
    titleKey: "brainOn.category.cars",
    descriptionKey: "brainOn.category.carsDescription",
  },
  {
    id: "geography",
    titleKey: "brainOn.category.geography",
    descriptionKey: "brainOn.category.geographyDescription",
  },
  {
    id: "science",
    titleKey: "brainOn.category.science",
    descriptionKey: "brainOn.category.scienceDescription",
  },
  {
    id: "popCulture",
    titleKey: "brainOn.category.popCulture",
    descriptionKey: "brainOn.category.popCultureDescription",
  },
];

export const brainOnCategoryIds = brainOnCategories.map(
  (category) => category.id
);

export const defaultBrainOnSettings: BrainOnSettings = {
  version: 1,
  alcoholModeEnabled: false,
  selectedCategoryIds: brainOnCategoryIds,
};

export function createBrainOnParticipant(name = ""): Participant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gender: "male",
    name,
  };
}

export function createDefaultBrainOnParticipants() {
  return [createBrainOnParticipant(), createBrainOnParticipant()];
}

export function getNamedBrainOnParticipants(participants: Participant[]) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}

export function isBrainOnCategoryId(
  value: unknown
): value is BrainOnCategoryId {
  return (
    typeof value === "string" &&
    brainOnCategoryIds.includes(value as BrainOnCategoryId)
  );
}

export function clampBrainOnSettings(
  settings: BrainOnSettings,
  isAdult: boolean
): BrainOnSettings {
  const selectedCategoryIds =
    settings.selectedCategoryIds.filter(isBrainOnCategoryId);

  return {
    version: 1,
    alcoholModeEnabled: isAdult ? settings.alcoholModeEnabled : false,
    selectedCategoryIds:
      selectedCategoryIds.length > 0 ? selectedCategoryIds : brainOnCategoryIds,
  };
}
