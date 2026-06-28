import type { Participant } from "@/features/mafia/types";
import type {
  TruthOrDareCategory,
  TruthOrDareCategoryId,
  TruthOrDareSettings,
} from "@/features/truth-or-dare/types";

export const MIN_TRUTH_OR_DARE_PLAYERS = 2;

export const truthOrDareCategories: readonly TruthOrDareCategory[] = [
  {
    id: "fun",
    titleKey: "truthOrDare.category.fun",
    descriptionKey: "truthOrDare.category.funDescription",
    isAdultOnly: false,
  },
  {
    id: "soft",
    titleKey: "truthOrDare.category.soft",
    descriptionKey: "truthOrDare.category.softDescription",
    isAdultOnly: false,
  },
  {
    id: "hot",
    titleKey: "truthOrDare.category.hot",
    descriptionKey: "truthOrDare.category.hotDescription",
    isAdultOnly: false,
  },
  {
    id: "hard",
    titleKey: "truthOrDare.category.hard",
    descriptionKey: "truthOrDare.category.hardDescription",
    isAdultOnly: false,
  },
  {
    id: "extreme",
    titleKey: "truthOrDare.category.extreme",
    descriptionKey: "truthOrDare.category.extremeDescription",
    isAdultOnly: true,
  },
  {
    id: "18plus",
    titleKey: "truthOrDare.category.18plus",
    descriptionKey: "truthOrDare.category.18plusDescription",
    isAdultOnly: true,
  },
];

export const truthOrDareCategoryIds = truthOrDareCategories.map(
  (category) => category.id
);

export const defaultTruthOrDareSettings: TruthOrDareSettings = {
  version: 1,
  alcoholModeEnabled: false,
  selectedCategoryIds: truthOrDareCategoryIds,
};

export function createTruthOrDareParticipant(name = ""): Participant {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    gender: "male",
    name,
  };
}

export function createDefaultTruthOrDareParticipants() {
  return [createTruthOrDareParticipant(), createTruthOrDareParticipant()];
}

export function getNamedTruthOrDareParticipants(participants: Participant[]) {
  return participants
    .map((participant) => ({
      ...participant,
      name: participant.name.trim(),
    }))
    .filter((participant) => participant.name.length > 0);
}

export function getAvailableTruthOrDareCategoryIds(isAdult: boolean) {
  return truthOrDareCategories
    .filter((category) => isAdult || !category.isAdultOnly)
    .map((category) => category.id);
}

export function isTruthOrDareCategoryId(
  value: unknown
): value is TruthOrDareCategoryId {
  return (
    typeof value === "string" &&
    truthOrDareCategoryIds.includes(value as TruthOrDareCategoryId)
  );
}

export function clampTruthOrDareSettings(
  settings: TruthOrDareSettings,
  isAdult: boolean
): TruthOrDareSettings {
  const availableCategoryIds = getAvailableTruthOrDareCategoryIds(isAdult);
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
