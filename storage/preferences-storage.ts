import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";

export type ThemeMode = "system" | "light" | "dark";
export type LanguageMode = "system" | "en" | "uk";

const dateOnlyIsoPattern = /^\d{4}-\d{2}-\d{2}$/;

export interface AppPreferences {
  dateOfBirthIso?: string;
  languageMode: LanguageMode;
  themeMode: ThemeMode;
  version: 1;
}

export const defaultPreferences: AppPreferences = {
  version: 1,
  themeMode: "system",
  languageMode: "system",
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function isLanguageMode(value: unknown): value is LanguageMode {
  return value === "system" || value === "en" || value === "uk";
}

export function isDateOnlyIso(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  if (!dateOnlyIsoPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= new Date()
  );
}

export function parsePreferences(value: unknown): AppPreferences {
  if (!value) {
    return defaultPreferences;
  }

  if (!isRecord(value)) {
    return defaultPreferences;
  }

  return {
    version: 1,
    dateOfBirthIso: isDateOnlyIso(value.dateOfBirthIso)
      ? value.dateOfBirthIso
      : undefined,
    themeMode: isThemeMode(value.themeMode)
      ? value.themeMode
      : defaultPreferences.themeMode,
    languageMode: isLanguageMode(value.languageMode)
      ? value.languageMode
      : defaultPreferences.languageMode,
  };
}

export function loadPreferences() {
  return localStorageService.get(
    storageKeys.preferences,
    defaultPreferences,
    parsePreferences
  );
}

export async function savePreferences(preferences: AppPreferences) {
  await localStorageService.set(storageKeys.preferences, preferences);
}
