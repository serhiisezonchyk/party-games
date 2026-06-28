import type { Participant } from "@/features/mafia/types";
import type {
  NeverHaveIEverCategory,
  NeverHaveIEverCategoryId,
  NeverHaveIEverSettings,
} from "@/features/never-have-i-ever/types";

export const MIN_NEVER_HAVE_I_EVER_PLAYERS = 2;

export const neverHaveIEverCategories: readonly NeverHaveIEverCategory[] = [
  {
    id: "lite",
    titleKey: "neverHaveIEver.category.lite",
    descriptionKey: "neverHaveIEver.category.liteDescription",
    isAdultOnly: false,
  },
  {
    id: "medium",
    titleKey: "neverHaveIEver.category.medium",
    descriptionKey: "neverHaveIEver.category.mediumDescription",
    isAdultOnly: false,
  },
  {
    id: "adult",
    titleKey: "neverHaveIEver.category.adult",
    descriptionKey: "neverHaveIEver.category.adultDescription",
    isAdultOnly: true,
  },
];

export const neverHaveIEverCategoryIds = neverHaveIEverCategories.map(
  (category) => category.id
);

export const defaultNeverHaveIEverSettings: NeverHaveIEverSettings = {
  version: 1,
  alcoholModeEnabled: false,
  selectedCategoryIds: neverHaveIEverCategoryIds,
};

export function createNeverHaveIEverParticipant(name = ""): Participant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gender: "male",
    name,
  };
}

export function createDefaultNeverHaveIEverParticipants() {
  return [createNeverHaveIEverParticipant(), createNeverHaveIEverParticipant()];
}

export function getNamedNeverHaveIEverParticipants(
  participants: Participant[]
) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}

export function getAvailableNeverHaveIEverCategoryIds(isAdult: boolean) {
  return neverHaveIEverCategories
    .filter((category) => isAdult || !category.isAdultOnly)
    .map((category) => category.id);
}

export function isNeverHaveIEverCategoryId(
  value: unknown
): value is NeverHaveIEverCategoryId {
  return (
    typeof value === "string" &&
    neverHaveIEverCategoryIds.includes(value as NeverHaveIEverCategoryId)
  );
}

export function clampNeverHaveIEverSettings(
  settings: NeverHaveIEverSettings,
  isAdult: boolean
): NeverHaveIEverSettings {
  const availableCategoryIds = getAvailableNeverHaveIEverCategoryIds(isAdult);
  const selectedCategoryIds = settings.selectedCategoryIds.filter(
    (categoryId) => availableCategoryIds.includes(categoryId)
  );

  return {
    version: 1,
    alcoholModeEnabled: isAdult ? settings.alcoholModeEnabled : false,
    selectedCategoryIds:
      selectedCategoryIds.length > 0
        ? selectedCategoryIds
        : availableCategoryIds,
  };
}
