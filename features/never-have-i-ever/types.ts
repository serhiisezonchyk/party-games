import type { Participant } from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

export type NeverHaveIEverCategoryId = "lite" | "medium" | "adult";

export interface NeverHaveIEverLocalizedText {
  en: string;
  uk: string;
}

export interface NeverHaveIEverCategory {
  descriptionKey: TranslationKey;
  id: NeverHaveIEverCategoryId;
  isAdultOnly: boolean;
  titleKey: TranslationKey;
}

export interface NeverHaveIEverPrompt {
  categoryId: NeverHaveIEverCategoryId;
  id: string;
  text: NeverHaveIEverLocalizedText;
}

export interface NeverHaveIEverSettings {
  alcoholModeEnabled: boolean;
  selectedCategoryIds: NeverHaveIEverCategoryId[];
  version: 1;
}

export interface NeverHaveIEverRevealedCard {
  promptId: string;
  revealedAt: string;
  sipCount?: number;
}

export interface NeverHaveIEverActiveGame {
  createdAt: string;
  currentCard?: NeverHaveIEverRevealedCard;
  currentPlayerIndex: number;
  endedAt?: string;
  id: string;
  players: Participant[];
  promptDeckCursor: number;
  promptIds: string[];
  settings: NeverHaveIEverSettings;
  version: 1;
}
