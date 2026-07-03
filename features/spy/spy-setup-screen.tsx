import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ParticipantsList } from "@/components/participants-list";
import { ParticleBackground } from "@/components/particle-background";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import type { Participant } from "@/features/mafia/types";
import {
  clampSpySettings,
  createSpyParticipant,
  defaultSpyCustomContent,
  defaultSpySettings,
  getAvailableSpyPackageIds,
  getNamedSpyParticipants,
  MIN_SPY_PLAYERS,
} from "@/features/spy/defaults";
import {
  createSpyActiveGame,
  getVisibleSpyPlaces,
} from "@/features/spy/game-engine";
import { SpyContentModal } from "@/features/spy/spy-content-modal";
import { SpySettingsPanel } from "@/features/spy/spy-settings-panel";
import {
  loadSpyCustomContent,
  loadSpyParticipants,
  loadSpySettings,
  saveActiveSpyGame,
  saveSpyCustomContent,
  saveSpySettings,
} from "@/features/spy/storage";
import type { SpyCustomContent, SpySettings } from "@/features/spy/types";
import {
  loadParticipants,
  saveParticipants,
} from "@/storage/participants-storage";

function getStartHint({
  canStart,
  hasPlaces,
  t,
}: {
  canStart: boolean;
  hasPlaces: boolean;
  t: ReturnType<typeof usePreferences>["t"];
}) {
  if (canStart) {
    return t("spy.start.ready");
  }

  if (!hasPlaces) {
    return t("spy.start.needPlaces");
  }

  return t("spy.start.needPlayers");
}

export function SpySetupScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<SpySettings>(defaultSpySettings);
  const [customContent, setCustomContent] = useState<SpyCustomContent>(
    defaultSpyCustomContent
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCustomContentVisible, setIsCustomContentVisible] = useState(false);
  const [initialCustomPackageId, setInitialCustomPackageId] = useState<
    string | undefined
  >(undefined);

  const namedParticipantCount = useMemo(
    () => getNamedSpyParticipants(participants).length,
    [participants]
  );
  const canConfigureRound = namedParticipantCount >= MIN_SPY_PLAYERS;
  const visiblePlaceCount = useMemo(
    () =>
      getVisibleSpyPlaces(customContent, settings, effectiveLanguage).length,
    [customContent, effectiveLanguage, settings]
  );
  const canStart = canConfigureRound && visiblePlaceCount > 0;
  const footerHint = getStartHint({
    canStart,
    hasPlaces: visiblePlaceCount > 0,
    t,
  });

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadSpyParticipants(), loadSpyCustomContent()])
      .then(async ([legacyParticipants, loadedCustomContent]) => {
        const loadedParticipants = await loadParticipants(legacyParticipants);
        const loadedSettings = await loadSpySettings(
          loadedCustomContent,
          getNamedSpyParticipants(loadedParticipants).length
        );

        if (!isMounted) {
          return;
        }

        setParticipants(loadedParticipants);
        setCustomContent(loadedCustomContent);
        setSettings(loadedSettings);
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("Failed to load Spy setup", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    setSettings((currentSettings) =>
      clampSpySettings(
        currentSettings,
        namedParticipantCount,
        getAvailableSpyPackageIds(customContent)
      )
    );
  }, [customContent, isLoaded, namedParticipantCount]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveParticipants(participants).catch((error: unknown) => {
      console.warn("Failed to save participants", error);
    });
  }, [isLoaded, participants]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveSpySettings(settings).catch((error: unknown) => {
      console.warn("Failed to save Spy settings", error);
    });
  }, [isLoaded, settings]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveSpyCustomContent(customContent).catch((error: unknown) => {
      console.warn("Failed to save Spy content", error);
    });
  }, [customContent, isLoaded]);

  function handleAddParticipant() {
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      createSpyParticipant(),
    ]);
  }

  function handleOpenCustomContent(packageId?: string) {
    setInitialCustomPackageId(packageId);
    setIsCustomContentVisible(true);
  }

  function handleRemovePackage(packageId: string, isCustomPackage: boolean) {
    setCustomContent((currentContent) => {
      if (isCustomPackage) {
        return {
          ...currentContent,
          packages: currentContent.packages.filter(
            (contentPackage) => contentPackage.id !== packageId
          ),
        };
      }

      return {
        ...currentContent,
        hiddenPackageIds: currentContent.hiddenPackageIds.includes(packageId)
          ? currentContent.hiddenPackageIds
          : [...currentContent.hiddenPackageIds, packageId],
      };
    });
  }

  async function handleStart() {
    if (!canStart) {
      return;
    }

    const game = createSpyActiveGame({
      customContent,
      language: effectiveLanguage,
      participants,
      settings,
    });

    if (!game) {
      return;
    }

    await Promise.all([
      saveParticipants(participants),
      saveSpySettings(game.settings),
      saveSpyCustomContent(customContent),
      saveActiveSpyGame(game),
    ]);
    setSettings(game.settings);
    router.push("/games/spy/play");
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
            {t("spy.setup.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("spy.setup.subtitle")}
          </Text>
        </View>

        <Section palette={palette} title={t("spy.participants.title")}>
          <Text style={[styles.sectionHelp, { color: palette.mutedText }]}>
            {t("spy.participants.help")}
          </Text>
          <ParticipantsList
            onAdd={handleAddParticipant}
            onChange={setParticipants}
            palette={palette}
            participants={participants}
            t={t}
          />
        </Section>

        <Section palette={palette} title={t("spy.settings.title")}>
          <SpySettingsPanel
            customContent={customContent}
            language={effectiveLanguage}
            onChange={setSettings}
            onEditCustomContent={handleOpenCustomContent}
            onRemovePackage={handleRemovePackage}
            palette={palette}
            participantCount={namedParticipantCount}
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
            {t("spy.start.button")}
          </Text>
        </Pressable>
      </View>

      <SpyContentModal
        customContent={customContent}
        initialPackageId={initialCustomPackageId}
        language={effectiveLanguage}
        onChange={setCustomContent}
        onClose={() => setIsCustomContentVisible(false)}
        palette={palette}
        t={t}
        visible={isCustomContentVisible}
      />
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
    paddingBottom: 132,
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
    lineHeight: 24,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  sectionHelp: {
    fontSize: 14,
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
    minHeight: 54,
    justifyContent: "center",
  },
  startText: {
    fontSize: 17,
    fontWeight: "900",
  },
});
