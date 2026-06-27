import { getLocales } from "expo-localization";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { Language, TranslationKey } from "@/i18n/translations";
import { translate } from "@/i18n/translations";
import {
  type AppPreferences,
  defaultPreferences,
  type LanguageMode,
  loadPreferences,
  savePreferences,
  type ThemeMode,
} from "@/storage/preferences-storage";

type EffectiveTheme = "light" | "dark";

interface PreferencesContextValue {
  closeSettings: () => void;
  effectiveLanguage: Language;
  effectiveTheme: EffectiveTheme;
  isSettingsVisible: boolean;
  openSettings: () => void;
  preferences: AppPreferences;
  setLanguageMode: (languageMode: LanguageMode) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  t: (key: TranslationKey) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getSystemLanguage(): Language {
  const languageCode = getLocales()[0]?.languageCode;

  return languageCode === "uk" ? "uk" : "en";
}

function resolveSystemTheme(systemTheme: string | null | undefined) {
  return systemTheme === "dark" ? "dark" : "light";
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [preferences, setPreferences] =
    useState<AppPreferences>(defaultPreferences);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadPreferences()
      .then((loadedPreferences) => {
        if (isMounted) {
          setPreferences(loadedPreferences);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load preferences", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePreferences = useCallback((nextPreferences: AppPreferences) => {
    setPreferences(nextPreferences);
    savePreferences(nextPreferences).catch((error: unknown) => {
      console.warn("Failed to save preferences", error);
    });
  }, []);

  const setThemeMode = useCallback(
    (themeMode: ThemeMode) => {
      updatePreferences({
        ...preferences,
        themeMode,
      });
    },
    [preferences, updatePreferences]
  );

  const setLanguageMode = useCallback(
    (languageMode: LanguageMode) => {
      updatePreferences({
        ...preferences,
        languageMode,
      });
    },
    [preferences, updatePreferences]
  );

  const effectiveTheme: EffectiveTheme =
    preferences.themeMode === "system"
      ? resolveSystemTheme(systemTheme)
      : preferences.themeMode;

  const effectiveLanguage =
    preferences.languageMode === "system"
      ? getSystemLanguage()
      : preferences.languageMode;

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      effectiveTheme,
      effectiveLanguage,
      isSettingsVisible,
      setThemeMode,
      setLanguageMode,
      openSettings: () => setIsSettingsVisible(true),
      closeSettings: () => setIsSettingsVisible(false),
      t: (key) => translate(effectiveLanguage, key),
    }),
    [
      effectiveLanguage,
      effectiveTheme,
      isSettingsVisible,
      preferences,
      setLanguageMode,
      setThemeMode,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const value = useContext(PreferencesContext);

  if (!value) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return value;
}
