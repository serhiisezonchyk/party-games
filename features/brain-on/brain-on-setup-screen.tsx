import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ParticipantsList } from "@/components/participants-list";
import { ParticleBackground } from "@/components/particle-background";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { BrainOnSettingsPanel } from "@/features/brain-on/brain-on-settings-panel";
import {
  clampBrainOnSettings,
  createBrainOnParticipant,
  createDefaultBrainOnParticipants,
  defaultBrainOnSettings,
  getNamedBrainOnParticipants,
  MIN_BRAIN_ON_PLAYERS,
} from "@/features/brain-on/defaults";
import {
  createBrainOnActiveGame,
  revealBrainOnQuestion,
} from "@/features/brain-on/game-engine";
import {
  loadBrainOnSettings,
  saveActiveBrainOnGame,
  saveBrainOnSettings,
} from "@/features/brain-on/storage";
import type { BrainOnSettings } from "@/features/brain-on/types";
import type { Participant } from "@/features/mafia/types";
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
    return t("brainOn.start.ready");
  }

  if (!hasCategories) {
    return t("brainOn.start.needCategories");
  }

  return t("brainOn.start.needPlayers");
}

export function BrainOnSetupScreen() {
  const router = useRouter();
  const { effectiveTheme, isPreferencesLoaded, openSettings, preferences, t } =
    usePreferences();
  const palette = Colors[effectiveTheme];
  const isAdult = isAdultDateOfBirth(preferences.dateOfBirthIso);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<BrainOnSettings>(
    clampBrainOnSettings(defaultBrainOnSettings, false)
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const namedParticipantCount = useMemo(
    () => getNamedBrainOnParticipants(participants).length,
    [participants]
  );
  const hasEnoughPlayers = namedParticipantCount >= MIN_BRAIN_ON_PLAYERS;
  const hasCategories = settings.selectedCategoryIds.length > 0;
  const canStart = hasEnoughPlayers && hasCategories;
  const footerHint = getSetupHint({ canStart, hasCategories, t });

  useEffect(() => {
    if (!isPreferencesLoaded) {
      return;
    }

    let isMounted = true;

    Promise.all([
      loadParticipants(createDefaultBrainOnParticipants()),
      loadBrainOnSettings(isAdult),
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
        console.warn("Failed to load Brain On setup", error);
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
      clampBrainOnSettings(currentSettings, isAdult)
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

    saveBrainOnSettings(settings, isAdult).catch((error: unknown) => {
      console.warn("Failed to save Brain On settings", error);
    });
  }, [isAdult, isLoaded, isPreferencesLoaded, settings]);

  function handleAddParticipant() {
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      createBrainOnParticipant(),
    ]);
  }

  function handleParticipantsChange(nextParticipants: Participant[]) {
    setParticipants(nextParticipants);
  }

  function handleSettingsChange(nextSettings: BrainOnSettings) {
    setSettings(nextSettings);
  }

  async function handleStart() {
    if (!canStart) {
      return;
    }

    const game = createBrainOnActiveGame({
      participants,
      settings,
    });

    if (!game) {
      return;
    }

    const gameWithFirstCard = revealBrainOnQuestion(game);

    await Promise.all([
      saveParticipants(participants),
      saveBrainOnSettings(settings, isAdult),
      saveActiveBrainOnGame(gameWithFirstCard),
    ]);
    router.push("/games/brain-on/play");
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
            {t("brainOn.setup.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("brainOn.setup.subtitle")}
          </Text>
        </View>

        <Section palette={palette} title={t("brainOn.participants.title")}>
          <Text style={[styles.sectionHelp, { color: palette.mutedText }]}>
            {t("brainOn.participants.help")}
          </Text>
          <ParticipantsList
            onAdd={handleAddParticipant}
            onChange={handleParticipantsChange}
            palette={palette}
            participants={participants}
            t={t}
          />
        </Section>

        <Section palette={palette} title={t("brainOn.settings.title")}>
          <BrainOnSettingsPanel
            isAdult={isAdult}
            onChange={handleSettingsChange}
            onOpenSettings={openSettings}
            palette={palette}
            settings={settings}
            t={t}
          />
        </Section>
      </ScrollView>

      <View
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
            styles.startButton,
            {
              backgroundColor: canStart ? palette.tint : palette.surface,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.startText,
              { color: canStart ? palette.onTint : palette.mutedText },
            ]}
          >
            {t("brainOn.start.button")}
          </Text>
        </Pressable>
      </View>
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
  startButton: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  startText: {
    fontSize: 16,
    fontWeight: "900",
  },
});
