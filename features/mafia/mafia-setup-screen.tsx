import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

import { ParticipantsList } from "@/components/participants-list";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import {
  createDefaultParticipants,
  createParticipant,
  defaultMafiaSettings,
  getRecommendedMafiaSettings,
  MIN_MAFIA_PLAYERS,
} from "@/features/mafia/defaults";
import { createMafiaActiveGame } from "@/features/mafia/game-engine";
import { MafiaSettingsPanel } from "@/features/mafia/mafia-settings-panel";
import { RestoreCompanyModal } from "@/features/mafia/restore-company-modal";
import {
  deleteSavedCompany,
  loadMafiaSettings,
  loadRecentCompanies,
  saveActiveMafiaGame,
  saveCurrentCompany,
  saveMafiaSettings,
} from "@/features/mafia/storage";
import type {
  MafiaSettings,
  Participant,
  SavedCompany,
} from "@/features/mafia/types";

export function MafiaSetupScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [participants, setParticipants] = useState<Participant[]>(
    createDefaultParticipants
  );
  const [settings, setSettings] = useState<MafiaSettings>(defaultMafiaSettings);
  const [recentCompanies, setRecentCompanies] = useState<SavedCompany[]>([]);
  const [isRestoreVisible, setIsRestoreVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const hasNamedLeader = participants[0]?.name.trim().length > 0;
  const namedPlayableParticipantCount = useMemo(
    () =>
      participants
        .slice(1)
        .filter((participant) => participant.name.trim().length > 0).length,
    [participants]
  );
  const playableParticipantCount = Math.max(0, participants.length - 1);
  const canStart =
    hasNamedLeader && namedPlayableParticipantCount >= MIN_MAFIA_PLAYERS;

  useEffect(() => {
    let isMounted = true;

    Promise.all([loadRecentCompanies(), loadMafiaSettings()])
      .then(([companies, loadedSettings]) => {
        if (!isMounted) {
          return;
        }

        setRecentCompanies(companies);
        setParticipants(
          companies[0]?.participants.length
            ? companies[0].participants
            : createDefaultParticipants()
        );
        setSettings(loadedSettings);
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        console.warn("Failed to load Mafia setup", error);
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

    setSettings((currentSettings) => {
      const recommendedSettings = getRecommendedMafiaSettings(
        playableParticipantCount,
        currentSettings
      ).settings;

      if (
        recommendedSettings.mafiaCount === currentSettings.mafiaCount &&
        recommendedSettings.sheriffCount === currentSettings.sheriffCount &&
        recommendedSettings.hasDon === currentSettings.hasDon &&
        recommendedSettings.doctorCount === currentSettings.doctorCount &&
        recommendedSettings.prostituteCount ===
          currentSettings.prostituteCount &&
        recommendedSettings.homelessCount === currentSettings.homelessCount &&
        recommendedSettings.maniacCount === currentSettings.maniacCount
      ) {
        return currentSettings;
      }

      return recommendedSettings;
    });
  }, [isLoaded, playableParticipantCount]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    saveMafiaSettings(settings).catch((error: unknown) => {
      console.warn("Failed to save Mafia settings", error);
    });
  }, [isLoaded, settings]);

  function handleAddParticipant() {
    setParticipants((currentParticipants) => [
      ...currentParticipants,
      createParticipant(),
    ]);
    setSaveMessage("");
  }

  function handleParticipantsChange(nextParticipants: Participant[]) {
    setParticipants(nextParticipants);
    setSaveMessage("");
  }

  function handleRestoreCompany(company: SavedCompany) {
    setParticipants(company.participants);
    setIsRestoreVisible(false);
    setSaveMessage("");
  }

  async function handleDeleteCompany(companyId: string) {
    const nextCompanies = await deleteSavedCompany(companyId);
    setRecentCompanies(nextCompanies);
  }

  async function handleStart() {
    if (!canStart) {
      return;
    }

    const nextCompanies = await saveCurrentCompany(participants);
    await saveMafiaSettings(settings);
    await saveActiveMafiaGame(createMafiaActiveGame(participants, settings));
    setRecentCompanies(nextCompanies);
    setSaveMessage(t("mafia.start.saved"));
    router.push("/games/mafia/play");
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <NestableScrollContainer contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: palette.text }]}>
            {t("mafia.setup.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("mafia.setup.subtitle")}
          </Text>
        </View>

        <Section
          action={
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsRestoreVisible(true)}
              style={({ pressed }) => [
                styles.restoreButton,
                {
                  backgroundColor: palette.surface,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <MaterialIcons color={palette.tint} name="history" size={18} />
              <Text style={[styles.restoreText, { color: palette.text }]}>
                {t("mafia.restore.button")}
              </Text>
            </Pressable>
          }
          palette={palette}
          title={t("mafia.participants.title")}
        >
          <Text style={[styles.sectionHelp, { color: palette.mutedText }]}>
            {t("mafia.participants.help")}
          </Text>
          <ParticipantsList
            onAdd={handleAddParticipant}
            onChange={handleParticipantsChange}
            palette={palette}
            participants={participants}
            t={t}
            withLeading
          />
        </Section>

        <Section palette={palette} title={t("mafia.settings.title")}>
          <MafiaSettingsPanel
            onChange={setSettings}
            palette={palette}
            participantCount={playableParticipantCount}
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
      </NestableScrollContainer>

      <View
        style={[
          styles.footer,
          { backgroundColor: palette.background, borderColor: palette.border },
        ]}
      >
        {canStart ? null : (
          <Text style={[styles.footerHint, { color: palette.mutedText }]}>
            {t("mafia.start.needPlayers")}
          </Text>
        )}
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
            {t("mafia.start.button")}
          </Text>
        </Pressable>
      </View>

      <RestoreCompanyModal
        companies={recentCompanies}
        onClose={() => setIsRestoreVisible(false)}
        onDelete={handleDeleteCompany}
        onRestore={handleRestoreCompany}
        palette={palette}
        t={t}
        visible={isRestoreVisible}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  action,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  palette: (typeof Colors)["light"];
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {title}
        </Text>
        {action}
      </View>
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
    paddingBottom: 116,
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
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
  },
  sectionHelp: {
    fontSize: 14,
    lineHeight: 20,
  },
  restoreButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    borderTopWidth: 1,
    bottom: 0,
    gap: 10,
    left: 0,
    padding: 16,
    position: "absolute",
    right: 0,
  },
  footerHint: {
    fontSize: 13,
    fontWeight: "700",
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
  savedBanner: {
    borderRadius: 16,
    padding: 14,
  },
  savedText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
