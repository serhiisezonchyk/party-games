import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { getTruthOrDarePromptById } from "@/features/truth-or-dare/content";
import {
  advanceTruthOrDarePlayer,
  rerollTruthOrDarePrompt,
  revealTruthOrDarePrompt,
} from "@/features/truth-or-dare/game-engine";
import {
  clearActiveTruthOrDareGame,
  loadActiveTruthOrDareGame,
  saveActiveTruthOrDareGame,
} from "@/features/truth-or-dare/storage";
import type {
  TruthOrDareActiveGame,
  TruthOrDarePromptType,
} from "@/features/truth-or-dare/types";
import { isAdultDateOfBirth } from "@/storage/preferences-storage";

type Palette = (typeof Colors)["light"];
type GameUpdater =
  | TruthOrDareActiveGame
  | ((game: TruthOrDareActiveGame) => TruthOrDareActiveGame);

function PrimaryButton({
  disabled = false,
  fill = false,
  label,
  onPress,
  palette,
}: {
  disabled?: boolean;
  fill?: boolean;
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
        fill ? styles.fillButton : null,
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

export function TruthOrDareGameplayScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, preferences, t } =
    usePreferences();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<TruthOrDareActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const flipValue = useRef(new Animated.Value(0)).current;
  const isAdult = isAdultDateOfBirth(preferences.dateOfBirthIso);

  const persistGame = useCallback((updater: GameUpdater) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      const nextGame =
        typeof updater === "function" ? updater(currentGame) : updater;

      saveActiveTruthOrDareGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Truth or Dare game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveTruthOrDareGame(isAdult)
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Truth or Dare game", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdult]);

  useEffect(() => {
    Animated.timing(flipValue, {
      duration: 320,
      toValue: game?.currentCard ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [flipValue, game?.currentCard]);

  function handleReveal(type: TruthOrDarePromptType) {
    persistGame((currentGame) => revealTruthOrDarePrompt(currentGame, type));
  }

  function handleReroll() {
    persistGame((currentGame) => rerollTruthOrDarePrompt(currentGame));
  }

  function handleNextPlayer() {
    persistGame((currentGame) => advanceTruthOrDarePlayer(currentGame));
  }

  async function handleEndGame() {
    if (game) {
      await saveActiveTruthOrDareGame({
        ...game,
        endedAt: new Date().toISOString(),
      });
    }

    await clearActiveTruthOrDareGame();
    router.replace("/games/truth-or-dare");
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
              {t("truthOrDare.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("truthOrDare.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("truthOrDare.game.noActive.back")}
              onPress={() => router.replace("/games/truth-or-dare")}
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
    ? getTruthOrDarePromptById(game.currentCard.promptId)
    : undefined;
  const frontRotate = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: palette.tint }]}>
            {t("truthOrDare.game.currentPlayer")}
          </Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {currentPlayer.name}
          </Text>
          <Text style={[styles.body, { color: palette.mutedText }]}>
            {t("truthOrDare.game.choosePrompt")}
          </Text>
        </View>

        <View style={styles.cardStage}>
          <Animated.View
            pointerEvents={game.currentCard ? "none" : "auto"}
            style={[
              styles.flipCard,
              styles.frontCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                transform: [{ rotateY: frontRotate }],
              },
            ]}
          >
            <Text style={[styles.cardKicker, { color: palette.mutedText }]}>
              {currentPlayer.name}
            </Text>
            <Text style={[styles.cardTitle, { color: palette.text }]}>
              {t("truthOrDare.game.cardHidden")}
            </Text>
            <View style={styles.choiceRow}>
              <PrimaryButton
                fill
                label={t("truthOrDare.game.truth")}
                onPress={() => handleReveal("truth")}
                palette={palette}
              />
              <PrimaryButton
                fill
                label={t("truthOrDare.game.dare")}
                onPress={() => handleReveal("dare")}
                palette={palette}
              />
            </View>
          </Animated.View>

          <Animated.View
            pointerEvents={game.currentCard ? "auto" : "none"}
            style={[
              styles.flipCard,
              styles.backCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                transform: [{ rotateY: backRotate }],
              },
            ]}
          >
            {game.settings.alcoholModeEnabled ? null : (
              <Pressable
                accessibilityLabel={t("truthOrDare.game.rerollPrompt")}
                accessibilityRole="button"
                onPress={handleReroll}
                style={({ pressed }) => [
                  styles.rerollButton,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <MaterialIcons color={palette.tint} name="refresh" size={24} />
              </Pressable>
            )}
            <Text style={[styles.cardKicker, { color: palette.tint }]}>
              {game.currentCard?.type === "truth"
                ? t("truthOrDare.game.truth")
                : t("truthOrDare.game.dare")}
            </Text>
            <Text style={[styles.promptText, { color: palette.text }]}>
              {currentPrompt
                ? currentPrompt.text[effectiveLanguage]
                : t("truthOrDare.game.promptMissing")}
            </Text>

            {game.settings.alcoholModeEnabled && currentPrompt ? (
              <View
                style={[
                  styles.penaltyBox,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                ]}
              >
                <Text style={[styles.penaltyLabel, { color: palette.tint }]}>
                  {t("truthOrDare.game.penalty")}
                </Text>
                <Text style={[styles.penaltyText, { color: palette.text }]}>
                  {currentPrompt.alcoholPenalty[effectiveLanguage]}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </View>

        {game.currentCard ? (
          <View style={styles.actions}>
            <PrimaryButton
              label={t("truthOrDare.game.nextPlayer")}
              onPress={handleNextPlayer}
              palette={palette}
            />
          </View>
        ) : null}

        <SecondaryButton
          label={t("truthOrDare.game.endGame")}
          onPress={handleEndGame}
          palette={palette}
        />
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
  cardStage: {
    minHeight: 360,
  },
  flipCard: {
    backfaceVisibility: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
    justifyContent: "center",
    minHeight: 360,
    padding: 22,
    width: "100%",
  },
  frontCard: {
    position: "absolute",
  },
  backCard: {
    position: "absolute",
  },
  rerollButton: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 14,
    width: 44,
    zIndex: 2,
  },
  cardKicker: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 12,
  },
  promptText: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center",
  },
  penaltyBox: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  penaltyText: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
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
  fillButton: {
    flex: 1,
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
