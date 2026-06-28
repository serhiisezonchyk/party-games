import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { ParticleBackground } from "@/components/particle-background";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { AliasSettingsPanel } from "@/features/alias/alias-settings-panel";
import { AliasTeamList } from "@/features/alias/alias-team-list";
import {
  clampAliasSettings,
  createDefaultAliasTeams,
  defaultAliasSettings,
  getNamedAliasTeams,
  MIN_ALIAS_TEAMS,
} from "@/features/alias/defaults";
import { createAliasActiveGame } from "@/features/alias/game-engine";
import {
  loadAliasSettings,
  loadAliasTeams,
  saveActiveAliasGame,
  saveAliasSettings,
  saveAliasTeams,
} from "@/features/alias/storage";
import type { AliasSettings, AliasTeam } from "@/features/alias/types";

function getSetupHint({
  canSave,
  hasCategories,
  t,
}: {
  canSave: boolean;
  hasCategories: boolean;
  t: ReturnType<typeof usePreferences>["t"];
}) {
  if (canSave) {
    return t("alias.setup.ready");
  }

  if (!hasCategories) {
    return t("alias.setup.needCategories");
  }

  return t("alias.setup.needTeams");
}

export function AliasSetupScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [teams, setTeams] = useState<AliasTeam[]>(createDefaultAliasTeams);
  const [settings, setSettings] = useState<AliasSettings>(defaultAliasSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const namedTeamCount = useMemo(
    () => getNamedAliasTeams(teams).length,
    [teams]
  );
  const hasEnoughTeams = namedTeamCount >= MIN_ALIAS_TEAMS;
  const hasCategories = settings.selectedCategoryIds.length > 0;
  const canSave = hasEnoughTeams && hasCategories;
  const footerHint = getSetupHint({ canSave, hasCategories, t });

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadAliasTeams(), loadAliasSettings()])
      .then(([loadedTeams, loadedSettings]) => {
        if (!isMounted) {
          return;
        }

        setTeams(loadedTeams);
        setSettings(loadedSettings);
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("Failed to load Alias setup", error);
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

    setSettings((currentSettings) => clampAliasSettings(currentSettings));
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveAliasTeams(teams).catch((error: unknown) => {
      console.warn("Failed to save Alias teams", error);
    });
  }, [isLoaded, teams]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveAliasSettings(settings).catch((error: unknown) => {
      console.warn("Failed to save Alias settings", error);
    });
  }, [isLoaded, settings]);

  async function handleStartGame() {
    if (!canSave) {
      return;
    }

    const game = createAliasActiveGame({
      settings,
      teams,
    });

    if (!game) {
      return;
    }

    await Promise.all([
      saveAliasTeams(teams),
      saveAliasSettings(settings),
      saveActiveAliasGame(game),
    ]);
    router.push("/games/alias/play");
  }

  function handleTeamsChange(nextTeams: AliasTeam[]) {
    setTeams(nextTeams);
    setSaveMessage("");
  }

  function handleSettingsChange(nextSettings: AliasSettings) {
    setSettings(nextSettings);
    setSaveMessage("");
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ParticleBackground theme={effectiveTheme} />
        <View style={styles.hero}>
          <Text style={[styles.title, { color: palette.text }]}>
            {t("alias.setup.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("alias.setup.subtitle")}
          </Text>
        </View>

        <Section palette={palette} title={t("alias.teams.title")}>
          <Text style={[styles.sectionHelp, { color: palette.mutedText }]}>
            {t("alias.teams.help")}
          </Text>
          <AliasTeamList
            onChange={handleTeamsChange}
            palette={palette}
            t={t}
            teams={teams}
          />
        </Section>

        <Section palette={palette} title={t("alias.settings.title")}>
          <AliasSettingsPanel
            language={effectiveLanguage}
            onChange={handleSettingsChange}
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
          disabled={!canSave}
          onPress={handleStartGame}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: canSave ? palette.tint : palette.surface,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.startText,
              { color: canSave ? palette.onTint : palette.mutedText },
            ]}
          >
            {t("alias.start.button")}
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
  savedBanner: {
    borderRadius: 16,
    padding: 14,
  },
  savedText: {
    fontSize: 14,
    fontWeight: "800",
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
