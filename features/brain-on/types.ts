import type { Participant } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

export type BrainOnCategoryId =
  | "history"
  | "oceans"
  | "cars"
  | "geography"
  | "science"
  | "popCulture";

export interface BrainOnLocalizedText {
  en: string;
  uk: string;
}

export interface BrainOnCategory {
  descriptionKey: TranslationKey;
  id: BrainOnCategoryId;
  titleKey: TranslationKey;
}

export interface BrainOnQuestion {
  answer: BrainOnLocalizedText;
  categoryId: BrainOnCategoryId;
  id: string;
  question: BrainOnLocalizedText;
}

export interface BrainOnSettings {
  alcoholModeEnabled: boolean;
  selectedCategoryIds: BrainOnCategoryId[];
  version: 1;
}

export interface BrainOnRevealedCard {
  penaltySipCount?: number;
  questionId: string;
  revealedAt: string;
}

export interface BrainOnActiveGame {
  createdAt: string;
  currentCard?: BrainOnRevealedCard;
  currentPlayerIndex: number;
  endedAt?: string;
  id: string;
  players: Participant[];
  questionDeckCursor: number;
  questionIds: string[];
  settings: BrainOnSettings;
  version: 1;
}
