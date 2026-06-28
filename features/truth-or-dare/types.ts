import type { Participant } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

export type TruthOrDareCategoryId =
  | "fun"
  | "soft"
  | "hot"
  | "hard"
  | "extreme"
  | "18plus";

export type TruthOrDarePromptType = "truth" | "dare";

export interface TruthOrDareLocalizedText {
  en: string;
  uk: string;
}

export interface TruthOrDareCategory {
  descriptionKey: TranslationKey;
  id: TruthOrDareCategoryId;
  isAdultOnly: boolean;
  titleKey: TranslationKey;
}

export interface TruthOrDarePrompt {
  alcoholPenalty: TruthOrDareLocalizedText;
  categoryId: TruthOrDareCategoryId;
  id: string;
  text: TruthOrDareLocalizedText;
  type: TruthOrDarePromptType;
}

export interface TruthOrDareSettings {
  alcoholModeEnabled: boolean;
  selectedCategoryIds: TruthOrDareCategoryId[];
  version: 1;
}

export interface TruthOrDareRevealedCard {
  promptId: string;
  revealedAt: string;
  type: TruthOrDarePromptType;
}

export interface TruthOrDareActiveGame {
  createdAt: string;
  currentCard?: TruthOrDareRevealedCard;
  currentPlayerIndex: number;
  dareDeckCursor: number;
  darePromptIds: string[];
  endedAt?: string;
  id: string;
  players: Participant[];
  settings: TruthOrDareSettings;
  truthDeckCursor: number;
  truthPromptIds: string[];
  version: 1;
}
