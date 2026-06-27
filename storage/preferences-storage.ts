import {
  localStorageService,
  storageKeys,
} from "@/storage/local-storage-service";

export type ThemeMode = "system" | "light" | "dark";
export type LanguageMode = "system" | "en" | "uk";

export interface AppPreferences {
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

export function parsePreferences(value: unknown): AppPreferences {
  if (!value) {
    return defaultPreferences;
  }

  if (!isRecord(value)) {
    return defaultPreferences;
  }

  return {
    version: 1,
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
