import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { getNeverHaveIEverPromptById } from "@/features/never-have-i-ever/content";
import { advanceNeverHaveIEverPlayer } from "@/features/never-have-i-ever/game-engine";
import {
  clearActiveNeverHaveIEverGame,
  loadActiveNeverHaveIEverGame,
  saveActiveNeverHaveIEverGame,
} from "@/features/never-have-i-ever/storage";
import type { NeverHaveIEverActiveGame } from "@/features/never-have-i-ever/types";
import type { Language, TranslationKey } from "@/i18n/translations";
import { isAdultDateOfBirth } from "@/storage/preferences-storage";

type Palette = (typeof Colors)["light"];
type GameUpdater =
  | NeverHaveIEverActiveGame
  | ((game: NeverHaveIEverActiveGame) => NeverHaveIEverActiveGame);

function getSipText({
  count,
  language,
  t,
}: {
  count: number;
  language: Language;
  t: (key: TranslationKey) => string;
}) {
  if (language === "uk") {
    if (count === 1) {
      return t("neverHaveIEver.game.sip.one").replace("{count}", String(count));
    }

    if (count >= 2 && count <= 4) {
      return t("neverHaveIEver.game.sip.few").replace("{count}", String(count));
    }

    return t("neverHaveIEver.game.sip.many").replace("{count}", String(count));
  }

  return t(
    count === 1
      ? "neverHaveIEver.game.sip.one"
      : "neverHaveIEver.game.sip.many"
  ).replace("{count}", String(count));
}

function PrimaryButton({
  disabled = false,
  label,
  onPress,
  palette,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: disabled ? palette.surface : palette.tint,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.primaryButtonText,
          { color: disabled ? palette.mutedText : palette.onTint },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: palette.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NeverHaveIEverGameplayScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, preferences, t } =
    usePreferences();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<NeverHaveIEverActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isAdult = isAdultDateOfBirth(preferences.dateOfBirthIso);

  const persistGame = useCallback((updater: GameUpdater) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      const nextGame =
        typeof updater === "function" ? updater(currentGame) : updater;

      saveActiveNeverHaveIEverGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Never Have I Ever game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveNeverHaveIEverGame(isAdult)
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Never Have I Ever game", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdult]);

  function handleNextPlayer() {
    persistGame((currentGame) => advanceNeverHaveIEverPlayer(currentGame));
  }

  async function handleEndGame() {
    if (game) {
      await saveActiveNeverHaveIEverGame({
        ...game,
        endedAt: new Date().toISOString(),
      });
    }

    await clearActiveNeverHaveIEverGame();
    router.replace("/games/never-have-i-ever");
  }

  if (!(isLoaded && game)) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.screen, { backgroundColor: palette.background }]}
      >
        <View style={styles.emptyContent}>
          <View
            style={[
              styles.panel,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <MaterialIcons color={palette.tint} name="style" size={44} />
            <Text style={[styles.title, { color: palette.text }]}>
              {t("neverHaveIEver.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("neverHaveIEver.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("neverHaveIEver.game.noActive.back")}
              onPress={() => router.replace("/games/never-have-i-ever")}
              palette={palette}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer =
    game.players[game.currentPlayerIndex] ?? game.players[0];
  const currentPrompt = game.currentCard
    ? getNeverHaveIEverPromptById(game.currentCard.promptId)
    : undefined;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: palette.tint }]}>
            {t("neverHaveIEver.game.currentPlayer")}
          </Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {currentPlayer.name}
          </Text>
          <Text style={[styles.body, { color: palette.mutedText }]}>
            {t("neverHaveIEver.game.cardHelp")}
          </Text>
        </View>

        <View
          style={[
            styles.promptCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.cardKicker, { color: palette.tint }]}>
            {currentPlayer.name}
          </Text>
          <Text style={[styles.cardLabel, { color: palette.mutedText }]}>
            {t("neverHaveIEver.game.cardLabel")}
          </Text>
          <Text style={[styles.promptText, { color: palette.text }]}>
            {currentPrompt
              ? currentPrompt.text[effectiveLanguage]
              : t("neverHaveIEver.game.promptMissing")}
          </Text>

          {game.settings.alcoholModeEnabled && game.currentCard?.sipCount ? (
            <View
              style={[
                styles.sipBox,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.sipLabel, { color: palette.tint }]}>
                {t("neverHaveIEver.game.alcoholLabel")}
              </Text>
              <Text style={[styles.sipText, { color: palette.text }]}>
                {t("neverHaveIEver.game.alcoholInstruction").replace(
                  "{sips}",
                  getSipText({
                    count: game.currentCard.sipCount,
                    language: effectiveLanguage,
                    t,
                  })
                )}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label={t("neverHaveIEver.game.nextPlayer")}
            onPress={handleNextPlayer}
            palette={palette}
          />
          <SecondaryButton
            label={t("neverHaveIEver.game.endGame")}
            onPress={handleEndGame}
            palette={palette}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    padding: 20,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23,
  },
  promptCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
    justifyContent: "center",
    minHeight: 390,
    padding: 22,
  },
  cardKicker: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  cardLabel: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    textAlign: "center",
  },
  promptText: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center",
  },
  sipBox: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  sipLabel: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  sipText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
    textAlign: "center",
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
});
