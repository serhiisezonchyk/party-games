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
import { getBrainOnQuestionById } from "@/features/brain-on/content";
import { advanceBrainOnPlayer } from "@/features/brain-on/game-engine";
import {
  clearActiveBrainOnGame,
  loadActiveBrainOnGame,
  saveActiveBrainOnGame,
} from "@/features/brain-on/storage";
import type { BrainOnActiveGame } from "@/features/brain-on/types";
import type { Language, TranslationKey } from "@/i18n/translations";
import { isAdultDateOfBirth } from "@/storage/preferences-storage";

type Palette = (typeof Colors)["light"];
type GameUpdater =
  | BrainOnActiveGame
  | ((game: BrainOnActiveGame) => BrainOnActiveGame);

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
      return t("brainOn.game.sip.one").replace("{count}", String(count));
    }

    return t("brainOn.game.sip.few").replace("{count}", String(count));
  }

  return t(
    count === 1 ? "brainOn.game.sip.one" : "brainOn.game.sip.few"
  ).replace("{count}", String(count));
}

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

export function BrainOnGameplayScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, preferences, t } =
    usePreferences();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<BrainOnActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isPenaltyVisible, setIsPenaltyVisible] = useState(false);
  const flipValue = useRef(new Animated.Value(0)).current;
  const isAdult = isAdultDateOfBirth(preferences.dateOfBirthIso);

  const persistGame = useCallback((updater: GameUpdater) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      const nextGame =
        typeof updater === "function" ? updater(currentGame) : updater;

      saveActiveBrainOnGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Brain On game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveBrainOnGame(isAdult)
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Brain On game", error);
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
      toValue: isAnswerVisible ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [flipValue, isAnswerVisible]);

  function handleFlipCard() {
    setIsAnswerVisible(true);
  }

  function handleCorrect() {
    setIsAnswerVisible(false);
    setIsPenaltyVisible(false);
    persistGame((currentGame) => advanceBrainOnPlayer(currentGame));
  }

  function handleWrong() {
    if (
      game?.settings.alcoholModeEnabled &&
      game.currentCard?.penaltySipCount
    ) {
      setIsPenaltyVisible(true);
      return;
    }

    handleCorrect();
  }

  function handleNextPlayer() {
    handleCorrect();
  }

  async function handleEndGame() {
    if (game) {
      await saveActiveBrainOnGame({
        ...game,
        endedAt: new Date().toISOString(),
      });
    }

    await clearActiveBrainOnGame();
    router.replace("/games/brain-on");
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
            <MaterialIcons color={palette.tint} name="psychology" size={44} />
            <Text style={[styles.title, { color: palette.text }]}>
              {t("brainOn.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("brainOn.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("brainOn.game.noActive.back")}
              onPress={() => router.replace("/games/brain-on")}
              palette={palette}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentPlayer =
    game.players[game.currentPlayerIndex] ?? game.players[0];
  const currentQuestion = game.currentCard
    ? getBrainOnQuestionById(game.currentCard.questionId)
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
            {t("brainOn.game.currentPlayer")}
          </Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {currentPlayer.name}
          </Text>
          <Text style={[styles.body, { color: palette.mutedText }]}>
            {t("brainOn.game.cardHelp")}
          </Text>
        </View>

        <View style={styles.cardStage}>
          <Animated.View
            pointerEvents={isAnswerVisible ? "none" : "auto"}
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
            <Pressable
              accessibilityRole="button"
              onPress={handleFlipCard}
              style={styles.cardPressArea}
            >
              <Text style={[styles.cardKicker, { color: palette.tint }]}>
                {currentPlayer.name}
              </Text>
              <Text style={[styles.cardLabel, { color: palette.mutedText }]}>
                {t("brainOn.game.question")}
              </Text>
              <Text style={[styles.promptText, { color: palette.text }]}>
                {currentQuestion
                  ? currentQuestion.question[effectiveLanguage]
                  : t("brainOn.game.questionMissing")}
              </Text>
              <Text style={[styles.tapHint, { color: palette.mutedText }]}>
                {t("brainOn.game.tapForAnswer")}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={isAnswerVisible ? "auto" : "none"}
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
            <Pressable
              accessibilityRole="button"
              onPress={() => undefined}
              style={styles.cardPressArea}
            >
              <Text style={[styles.cardKicker, { color: palette.tint }]}>
                {t("brainOn.game.answer")}
              </Text>
              <Text style={[styles.promptText, { color: palette.text }]}>
                {currentQuestion
                  ? currentQuestion.answer[effectiveLanguage]
                  : t("brainOn.game.questionMissing")}
              </Text>

              {isPenaltyVisible &&
              game.settings.alcoholModeEnabled &&
              game.currentCard?.penaltySipCount ? (
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
                    {t("brainOn.game.penalty")}
                  </Text>
                  <Text style={[styles.penaltyText, { color: palette.text }]}>
                    {t("brainOn.game.penaltyInstruction").replace(
                      "{sips}",
                      getSipText({
                        count: game.currentCard.penaltySipCount,
                        language: effectiveLanguage,
                        t,
                      })
                    )}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        </View>

        {isAnswerVisible ? (
          <View style={styles.choiceRow}>
            <PrimaryButton
              fill
              label={t("brainOn.game.correct")}
              onPress={handleCorrect}
              palette={palette}
            />
            <PrimaryButton
              fill
              label={t("brainOn.game.wrong")}
              onPress={handleWrong}
              palette={palette}
            />
          </View>
        ) : null}

        {isPenaltyVisible ? (
          <PrimaryButton
            label={t("brainOn.game.nextPlayer")}
            onPress={handleNextPlayer}
            palette={palette}
          />
        ) : null}

        <SecondaryButton
          label={t("brainOn.game.endGame")}
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
  cardStage: {
    minHeight: 390,
  },
  flipCard: {
    backfaceVisibility: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 390,
    width: "100%",
  },
  frontCard: {
    position: "absolute",
  },
  backCard: {
    position: "absolute",
  },
  cardPressArea: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center",
  },
  tapHint: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 12,
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
    fontWeight: "800",
    lineHeight: 23,
    textAlign: "center",
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
