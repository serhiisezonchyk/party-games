import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ParticipantsList } from "@/components/participants-list";
import { ParticleBackground } from "@/components/particle-background";
import { SetupFooter } from "@/components/setup-footer";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import type { Participant } from "@/features/mafia/types";
import {
  clampTruthOrDareSettings,
  createDefaultTruthOrDareParticipants,
  createTruthOrDareParticipant,
  defaultTruthOrDareSettings,
  getNamedTruthOrDareParticipants,
  MIN_TRUTH_OR_DARE_PLAYERS,
} from "@/features/truth-or-dare/defaults";
import { createTruthOrDareActiveGame } from "@/features/truth-or-dare/game-engine";
import {
  loadTruthOrDareSettings,
  saveActiveTruthOrDareGame,
  saveTruthOrDareSettings,
} from "@/features/truth-or-dare/storage";
import { TruthOrDareSettingsPanel } from "@/features/truth-or-dare/truth-or-dare-settings-panel";
import type { TruthOrDareSettings } from "@/features/truth-or-dare/types";
import {
  loadParticipants,
  saveParticipants,
} from "@/storage/participants-storage";
import { isAdultDateOfBirth } from "@/storage/preferences-storage";

function getSetupHint({
  canStart,
  hasCategories,
  t,
}: {
  canStart: boolean;
  hasCategories: boolean;
  t: ReturnType<typeof usePreferences>["t"];
}) {
  if (canStart) {
    return t("truthOrDare.start.ready");
  }

  if (!hasCategories) {
    return t("truthOrDare.start.needCategories");
  }

  return t("truthOrDare.start.needPlayers");
}

export function TruthOrDareSetupScreen() {
  const router = useRouter();
  const { effectiveTheme, isPreferencesLoaded, openSettings, preferences, t } =
    usePreferences();
  const palette = Colors[effectiveTheme];
  const isAdult = isAdultDateOfBirth(preferences.dateOfBirthIso);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<TruthOrDareSettings>(
    clampTruthOrDareSettings(defaultTruthOrDareSettings, false)
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const namedParticipantCount = useMemo(
    () => getNamedTruthOrDareParticipants(participants).length,
    [participants]
  );
  const hasEnoughPlayers = namedParticipantCount >= MIN_TRUTH_OR_DARE_PLAYERS;
  const hasCategories = settings.selectedCategoryIds.length > 0;
  const canStart = hasEnoughPlayers && hasCategories;
  const footerHint = getSetupHint({ canStart, hasCategories, t });

  useEffect(() => {
    if (!isPreferencesLoaded) {
      return;
    }

    let isMounted = true;

    Promise.all([
      loadParticipants(createDefaultTruthOrDareParticipants()),
      loadTruthOrDareSettings(isAdult),
    ])
      .then(([loadedParticipants, loadedSettings]) => {
        if (!isMounted) {
          return;
        }

        setParticipants(loadedParticipants);
        setSettings(loadedSettings);
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("Failed to load Truth or Dare setup", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdult, isPreferencesLoaded]);

  useEffect(() => {
    if (!(isLoaded && isPreferencesLoaded)) {
      return;
    }

    setSettings((currentSettings) =>
      clampTruthOrDareSettings(currentSettings, isAdult)
    );
  }, [isAdult, isLoaded, isPreferencesLoaded]);

  useEffect(() => {
    if (!(isLoaded && isPreferencesLoaded)) {
      return;
    }

    saveParticipants(participants).catch((error: unknown) => {
      console.warn("Failed to save participants", error);
    });
  }, [isLoaded, isPreferencesLoaded, participants]);

  useEffect(() => {
    if (!(isLoaded && isPreferencesLoaded)) {
      return;
    }

    saveTruthOrDareSettings(settings, isAdult).catch((error: unknown) => {
      console.warn("Failed to save Truth or Dare settings", error);
    });
  }, [isAdult, isLoaded, isPreferencesLoaded, settings]);

  function handleAddParticipant() {
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      createTruthOrDareParticipant(),
    ]);
    setSaveMessage("");
  }

  function handleParticipantsChange(nextParticipants: Participant[]) {
    setParticipants(nextParticipants);
    setSaveMessage("");
  }

  function handleSettingsChange(nextSettings: TruthOrDareSettings) {
    setSettings(nextSettings);
    setSaveMessage("");
  }

  async function handleStart() {
    if (!canStart) {
      return;
    }

    const game = createTruthOrDareActiveGame({
      participants,
      settings,
    });

    if (!game) {
      return;
    }

    await Promise.all([
      saveParticipants(participants),
      saveTruthOrDareSettings(settings, isAdult),
      saveActiveTruthOrDareGame(game),
    ]);
    router.push("/games/truth-or-dare/play");
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ParticleBackground theme={effectiveTheme} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: palette.text }]}>
            {t("truthOrDare.setup.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("truthOrDare.setup.subtitle")}
          </Text>
        </View>

        <Section palette={palette} title={t("truthOrDare.participants.title")}>
          <Text style={[styles.sectionHelp, { color: palette.mutedText }]}>
            {t("truthOrDare.participants.help")}
          </Text>
          <ParticipantsList
            onAdd={handleAddParticipant}
            onChange={handleParticipantsChange}
            palette={palette}
            participants={participants}
            t={t}
          />
        </Section>

        <Section palette={palette} title={t("truthOrDare.settings.title")}>
          <TruthOrDareSettingsPanel
            isAdult={isAdult}
            onChange={handleSettingsChange}
            onOpenSettings={openSettings}
            palette={palette}
            settings={settings}
            t={t}
          />
        </Section>

        {saveMessage ? (
          <View
            style={[styles.savedBanner, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.savedText, { color: palette.text }]}>
              {saveMessage}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <SetupFooter
        style={[
          styles.footer,
          { backgroundColor: palette.background, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.footerHint, { color: palette.mutedText }]}>
          {footerHint}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={!canStart}
          onPress={handleStart}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: canStart ? palette.tint : palette.surface,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.saveText,
              { color: canStart ? palette.onTint : palette.mutedText },
            ]}
          >
            {t("truthOrDare.start.button")}
          </Text>
        </Pressable>
      </SetupFooter>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  children: React.ReactNode;
  palette: (typeof Colors)["light"];
  title: string;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 124,
    position: "relative",
  },
  hero: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  sectionHelp: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  savedBanner: {
    borderRadius: 16,
    padding: 14,
  },
  savedText: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    bottom: 0,
    gap: 10,
    left: 0,
    padding: 16,
    position: "absolute",
    right: 0,
    zIndex: 2,
  },
  footerHint: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "900",
  },
});
