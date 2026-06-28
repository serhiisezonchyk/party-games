import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import {
  clearActiveSpyGame,
  loadActiveSpyGame,
  saveActiveSpyGame,
} from "@/features/spy/storage";
import type { SpyActiveGame } from "@/features/spy/types";
import type { TranslationKey } from "@/i18n/translations";

type Palette = (typeof Colors)["light"];
type GameUpdater = SpyActiveGame | ((game: SpyActiveGame) => SpyActiveGame);

const timerEndSound = require("../../assets/audio/spy-timer-end.wav");

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getRemainingSeconds(game: SpyActiveGame) {
  if (!game.timerStartedAt) {
    return game.settings.durationSec;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(game.timerStartedAt).getTime()) / 1000
  );

  return Math.max(0, game.settings.durationSec - elapsedSeconds);
}

export function SpyGameplayScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const { width } = useWindowDimensions();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<SpyActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isRevealTransitioning, setIsRevealTransitioning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerEndPlayer = useAudioPlayer(timerEndSound);
  const hasPlayedTimerEndSound = useRef(false);
  const previousRemainingSeconds = useRef(0);
  const flipValue = useRef(new Animated.Value(0)).current;
  const revealSlideValue = useRef(new Animated.Value(0)).current;
  const revealSlideDistance = width + 40;

  const persistGame = useCallback((updater: GameUpdater) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      const nextGame =
        typeof updater === "function" ? updater(currentGame) : updater;

      saveActiveSpyGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Spy game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveSpyGame()
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setRemainingSeconds(loadedGame ? getRemainingSeconds(loadedGame) : 0);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Spy game", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (game?.phase !== "cardReveal") {
      return;
    }

    setIsCardRevealed(false);
    flipValue.setValue(0);
    revealSlideValue.setValue(0);
  }, [flipValue, game?.phase, revealSlideValue]);

  useEffect(() => {
    if (game?.phase !== "timer") {
      hasPlayedTimerEndSound.current = false;
      previousRemainingSeconds.current = 0;
      return;
    }

    setRemainingSeconds(getRemainingSeconds(game));
    const intervalId = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(game));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [game]);

  useEffect(() => {
    if (game?.phase !== "timer") {
      return;
    }

    if (remainingSeconds > 0) {
      previousRemainingSeconds.current = remainingSeconds;
      return;
    }

    if (
      hasPlayedTimerEndSound.current ||
      previousRemainingSeconds.current <= 0
    ) {
      return;
    }

    hasPlayedTimerEndSound.current = true;

    try {
      timerEndPlayer.seekTo(0);
      timerEndPlayer.play();
    } catch (error: unknown) {
      console.warn("Failed to play Spy timer sound", error);
    }
  }, [game?.phase, remainingSeconds, timerEndPlayer]);

  function revealCard() {
    if (isCardRevealed) {
      return;
    }

    setIsCardRevealed(true);
    Animated.timing(flipValue, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }

  function handleNextReveal() {
    if (!(game && isCardRevealed) || isRevealTransitioning) {
      return;
    }

    setIsRevealTransitioning(true);

    if (game.revealIndex >= game.players.length - 1) {
      Animated.timing(revealSlideValue, {
        toValue: -revealSlideDistance,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setIsCardRevealed(false);
        setIsRevealTransitioning(false);
        flipValue.setValue(0);
        revealSlideValue.setValue(0);
        persistGame({
          ...game,
          phase: "timer",
          timerStartedAt: new Date().toISOString(),
        });
      });
      return;
    }

    Animated.timing(revealSlideValue, {
      toValue: -revealSlideDistance,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsCardRevealed(false);
      flipValue.setValue(0);
      revealSlideValue.setValue(revealSlideDistance);
      persistGame({ ...game, revealIndex: game.revealIndex + 1 });

      Animated.timing(revealSlideValue, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start(() => {
        setIsRevealTransitioning(false);
      });
    });
  }

  async function handleEndGame() {
    if (game) {
      await saveActiveSpyGame({
        ...game,
        phase: "ended",
        endedAt: new Date().toISOString(),
      });
    }
    await clearActiveSpyGame();
    router.replace("/games/spy");
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
            <MaterialIcons color={palette.tint} name="visibility" size={44} />
            <Text style={[styles.title, { color: palette.text }]}>
              {t("spy.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("spy.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("spy.game.noActive.back")}
              onPress={() => router.replace("/games/spy")}
              palette={palette}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.tint }]}>
              {t("games.spy.title")}
            </Text>
            <Text style={[styles.title, { color: palette.text }]}>
              {game.phase === "timer"
                ? t("spy.game.timerTitle")
                : t("spy.game.revealTitle")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleEndGame}
            style={({ pressed }) => [
              styles.endButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <MaterialIcons color={palette.icon} name="close" size={18} />
            <Text style={[styles.endText, { color: palette.text }]}>
              {t("spy.game.end")}
            </Text>
          </Pressable>
        </View>

        {game.phase === "cardReveal" ? (
          <CardRevealStage
            flipValue={flipValue}
            game={game}
            isCardRevealed={isCardRevealed}
            isTransitioning={isRevealTransitioning}
            onNext={handleNextReveal}
            onReveal={revealCard}
            palette={palette}
            slideDistance={revealSlideDistance}
            slideValue={revealSlideValue}
            t={t}
          />
        ) : null}

        {game.phase === "timer" ? (
          <TimerStage
            onEnd={handleEndGame}
            palette={palette}
            remainingSeconds={remainingSeconds}
            t={t}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CardRevealStage({
  flipValue,
  game,
  isCardRevealed,
  isTransitioning,
  onNext,
  onReveal,
  palette,
  slideDistance,
  slideValue,
  t,
}: {
  flipValue: Animated.Value;
  game: SpyActiveGame;
  isCardRevealed: boolean;
  isTransitioning: boolean;
  onNext: () => void;
  onReveal: () => void;
  palette: Palette;
  slideDistance: number;
  slideValue: Animated.Value;
  t: (key: TranslationKey) => string;
}) {
  const player = game.players[game.revealIndex];
  const frontRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotation = flipValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });
  const cardOpacity = slideValue.interpolate({
    extrapolate: "clamp",
    inputRange: [-slideDistance, 0, slideDistance],
    outputRange: [0.2, 1, 0.2],
  });

  if (!player) {
    return null;
  }

  let assignmentContent: ReactNode;

  if (player.isSpy) {
    assignmentContent = (
      <>
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {t("spy.card.spy")}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("spy.card.spyHelp")}
        </Text>
      </>
    );
  } else if (player.roleName) {
    assignmentContent = (
      <>
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {player.placeName}
        </Text>
        <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
          {t("spy.card.role")}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {player.roleName}
        </Text>
      </>
    );
  } else {
    assignmentContent = (
      <>
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {player.placeName}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("spy.card.placeHelp")}
        </Text>
      </>
    );
  }

  return (
    <View style={styles.stage}>
      <Text style={[styles.progressText, { color: palette.mutedText }]}>
        {game.revealIndex + 1} / {game.players.length}
      </Text>
      <Animated.View
        style={[
          styles.flipCardMotion,
          {
            opacity: cardOpacity,
            transform: [{ translateX: slideValue }],
          },
        ]}
      >
        <Pressable accessibilityRole="button" onPress={onReveal}>
          <View style={styles.flipCardSlot}>
            <Animated.View
              style={[
                styles.roleCard,
                styles.flipCardFace,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  transform: [{ perspective: 900 }, { rotateY: frontRotation }],
                },
              ]}
            >
              <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
                {t("spy.reveal.player")}
              </Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                {player.participant.name}
              </Text>
              <Text style={[styles.body, { color: palette.mutedText }]}>
                {t("spy.reveal.tap")}
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.roleCard,
                styles.flipCardFace,
                styles.flipCardBack,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  transform: [{ perspective: 900 }, { rotateY: backRotation }],
                },
              ]}
            >
              <MaterialIcons
                color={palette.tint}
                name={player.isSpy ? "visibility-off" : "place"}
                size={54}
              />
              {assignmentContent}
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>

      <PrimaryButton
        disabled={!isCardRevealed || isTransitioning}
        label={
          game.revealIndex >= game.players.length - 1
            ? t("spy.reveal.finish")
            : t("spy.reveal.next")
        }
        onPress={onNext}
        palette={palette}
      />
    </View>
  );
}

function TimerStage({
  onEnd,
  palette,
  remainingSeconds,
  t,
}: {
  onEnd: () => void;
  palette: Palette;
  remainingSeconds: number;
  t: (key: TranslationKey) => string;
}) {
  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.timerPanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <MaterialIcons color={palette.tint} name="timer" size={48} />
        <Text style={[styles.timerText, { color: palette.text }]}>
          {formatTimer(remainingSeconds)}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {remainingSeconds <= 0
            ? t("spy.game.timerDone")
            : t("spy.game.timerHelp")}
        </Text>
      </View>
      <PrimaryButton
        label={t("spy.game.end")}
        onPress={onEnd}
        palette={palette}
      />
    </View>
  );
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 22,
    padding: 20,
    paddingBottom: 36,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  endButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  endText: {
    fontSize: 13,
    fontWeight: "900",
  },
  stage: {
    alignItems: "center",
    gap: 18,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "800",
  },
  flipCardMotion: {
    width: "100%",
  },
  flipCardSlot: {
    height: 360,
    width: "100%",
  },
  roleCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    height: "100%",
    justifyContent: "center",
    padding: 24,
    width: "100%",
  },
  flipCardFace: {
    backfaceVisibility: "hidden",
    left: 0,
    position: "absolute",
    top: 0,
  },
  flipCardBack: {
    position: "absolute",
  },
  cardEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "900",
  },
  panel: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 20,
    width: "100%",
  },
  timerPanel: {
    minHeight: 260,
    justifyContent: "center",
  },
  timerText: {
    fontSize: 64,
    fontWeight: "900",
    lineHeight: 72,
    textAlign: "center",
  },
});
