import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { getAliasWordById } from "@/features/alias/content";
import {
  calculateAliasRoundStats,
  completeAliasRound,
  markAliasWord,
  startAliasRound,
  toggleAliasSummaryResult,
} from "@/features/alias/game-engine";
import {
  clearActiveAliasGame,
  loadActiveAliasGame,
  saveActiveAliasGame,
} from "@/features/alias/storage";
import type {
  AliasActiveGame,
  AliasTeam,
  AliasWordResultType,
} from "@/features/alias/types";
import { getLocalizedText } from "@/features/alias/types";
import type { TranslationKey } from "@/i18n/translations";

type Palette = (typeof Colors)["light"];
type GameUpdater =
  | AliasActiveGame
  | ((game: AliasActiveGame) => AliasActiveGame);

const SWIPE_THRESHOLD_RATIO = 0.28;
const SWIPE_MIN_DISTANCE = 84;
const SWIPE_MAX_DISTANCE = 132;

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getRemainingSeconds(game: AliasActiveGame) {
  if (!(game.phase === "round" && game.currentRound)) {
    return 0;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(game.currentRound.startedAt).getTime()) / 1000
  );

  return Math.max(0, game.settings.roundDurationSec - elapsedSeconds);
}

function getTeamScore(game: AliasActiveGame, team: AliasTeam) {
  return game.scores[team.id] ?? 0;
}

function getSwipeResult({
  dx,
  requiredDistance,
}: {
  dx: number;
  requiredDistance: number;
}): AliasWordResultType | null {
  if (Math.abs(dx) >= requiredDistance) {
    return dx > 0 ? "success" : "fail";
  }

  return null;
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

export function AliasGameplayScreen() {
  const router = useRouter();
  const { effectiveLanguage, effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<AliasActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const persistGame = useCallback((updater: GameUpdater) => {
    setGame((currentGame) => {
      if (!currentGame) {
        return currentGame;
      }

      const nextGame =
        typeof updater === "function" ? updater(currentGame) : updater;

      saveActiveAliasGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Alias game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveAliasGame()
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setRemainingSeconds(loadedGame ? getRemainingSeconds(loadedGame) : 0);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Alias game", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (game?.phase !== "round") {
      return;
    }

    setRemainingSeconds(getRemainingSeconds(game));
    const intervalId = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(game));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [game]);

  function handleStartRound() {
    persistGame((currentGame) => startAliasRound(currentGame));
  }

  function handleMarkWord(result: AliasWordResultType) {
    persistGame((currentGame) =>
      markAliasWord({
        game: currentGame,
        isTimerDone: remainingSeconds <= 0,
        result,
      })
    );
  }

  function handleToggleSummaryWord(wordResultId: string) {
    persistGame((currentGame) =>
      toggleAliasSummaryResult(currentGame, wordResultId)
    );
  }

  function handleCompleteRound() {
    persistGame((currentGame) => completeAliasRound(currentGame));
  }

  async function handleEndGame() {
    await clearActiveAliasGame();
    router.replace("/games/alias");
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
              {t("alias.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("alias.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("alias.game.noActive.back")}
              onPress={() => router.replace("/games/alias")}
              palette={palette}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentTeam = game.teams[game.currentTeamIndex];

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={game.phase !== "round"}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: palette.tint }]}>
              {t("games.alias.title")}
            </Text>
            <Text style={[styles.title, { color: palette.text }]}>
              {game.phase === "round"
                ? t("alias.game.roundTitle")
                : t("alias.game.title")}
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
              {t("alias.game.end")}
            </Text>
          </Pressable>
        </View>

        {game.phase === "handoff" && currentTeam ? (
          <HandoffStage
            currentTeam={currentTeam}
            game={game}
            onStart={handleStartRound}
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "round" ? (
          <RoundStage
            game={game}
            language={effectiveLanguage}
            onMark={handleMarkWord}
            palette={palette}
            remainingSeconds={remainingSeconds}
            t={t}
          />
        ) : null}

        {game.phase === "summary" && game.currentRound ? (
          <SummaryStage
            game={game}
            language={effectiveLanguage}
            onContinue={handleCompleteRound}
            onToggleWord={handleToggleSummaryWord}
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "ended" ? (
          <WinnerStage
            game={game}
            onNewGame={handleEndGame}
            palette={palette}
            t={t}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Scoreboard({
  game,
  palette,
}: {
  game: AliasActiveGame;
  palette: Palette;
}) {
  return (
    <View style={styles.scoreboard}>
      {game.teams.map((team) => (
        <View
          key={team.id}
          style={[
            styles.scoreRow,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.scoreTeam, { color: palette.text }]}>
            {team.name}
          </Text>
          <Text style={[styles.scoreValue, { color: palette.tint }]}>
            {getTeamScore(game, team)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HandoffStage({
  currentTeam,
  game,
  onStart,
  palette,
  t,
}: {
  currentTeam: AliasTeam;
  game: AliasActiveGame;
  onStart: () => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
          {t("alias.game.currentTeam")}
        </Text>
        <Text style={[styles.teamTitle, { color: palette.text }]}>
          {currentTeam.name}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("alias.game.handoffHelp")}
        </Text>
      </View>
      <Scoreboard game={game} palette={palette} />
      <PrimaryButton
        label={t("alias.game.startRound")}
        onPress={onStart}
        palette={palette}
      />
    </View>
  );
}

function RoundStage({
  game,
  language,
  onMark,
  palette,
  remainingSeconds,
  t,
}: {
  game: AliasActiveGame;
  language: "en" | "uk";
  onMark: (result: AliasWordResultType) => void;
  palette: Palette;
  remainingSeconds: number;
  t: (key: TranslationKey) => string;
}) {
  const { width } = useWindowDimensions();
  const panValue = useRef(new Animated.Value(0)).current;
  const entryValue = useRef(new Animated.Value(0)).current;
  const isAnimatingDecisionRef = useRef(false);
  const latestDragXRef = useRef(0);
  const swipeRequiredDistance = Math.min(
    SWIPE_MAX_DISTANCE,
    Math.max(SWIPE_MIN_DISTANCE, width * SWIPE_THRESHOLD_RATIO)
  );
  const currentWordId = game.currentRound?.currentWordId;
  const currentWord = currentWordId
    ? getAliasWordById(currentWordId)
    : undefined;
  const currentTeam = game.teams.find(
    (team) => team.id === game.currentRound?.teamId
  );
  const isTimerDone = remainingSeconds <= 0;
  const onGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationX: panValue } }], {
        listener: (event: PanGestureHandlerGestureEvent) => {
          latestDragXRef.current = event.nativeEvent.translationX;
        },
        useNativeDriver: true,
      }),
    [panValue]
  );

  useEffect(() => {
    if (!currentWordId) {
      return;
    }

    entryValue.setValue(0);
    Animated.timing(entryValue, {
      duration: 190,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [currentWordId, entryValue]);

  const animateDecision = useCallback(
    (result: AliasWordResultType) => {
      if (isAnimatingDecisionRef.current) {
        return;
      }

      isAnimatingDecisionRef.current = true;

      Animated.timing(panValue, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: result === "success" ? width + 140 : -(width + 140),
        useNativeDriver: true,
      }).start(({ finished }) => {
        panValue.setValue(0);
        isAnimatingDecisionRef.current = false;

        if (finished) {
          onMark(result);
        }
      });
    },
    [onMark, panValue, width]
  );

  const handleGestureStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      const { state, translationX, velocityX } = event.nativeEvent;

      if (state === State.BEGAN) {
        latestDragXRef.current = 0;
        return;
      }

      if (
        !(
          state === State.END ||
          state === State.CANCELLED ||
          state === State.FAILED
        )
      ) {
        return;
      }

      if (state === State.END) {
        const releaseX =
          Math.abs(latestDragXRef.current) > Math.abs(translationX)
            ? latestDragXRef.current
            : translationX;
        const swipeResult = getSwipeResult({
          dx: releaseX,
          requiredDistance: swipeRequiredDistance,
        });

        if (swipeResult) {
          animateDecision(swipeResult);
          return;
        }

        Animated.spring(panValue, {
          damping: 12,
          mass: 0.9,
          stiffness: 120,
          toValue: 0,
          useNativeDriver: true,
          velocity: velocityX,
        }).start(() => {
          panValue.setValue(0);
          latestDragXRef.current = 0;
        });
        return;
      }

      Animated.spring(panValue, {
        damping: 12,
        mass: 0.9,
        stiffness: 120,
        toValue: 0,
        useNativeDriver: true,
        velocity: velocityX,
      }).start(() => {
        panValue.setValue(0);
        latestDragXRef.current = 0;
      });
    },
    [animateDecision, panValue, swipeRequiredDistance]
  );

  if (!(currentWord && currentTeam)) {
    return null;
  }

  const rotate = panValue.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-8deg", "0deg", "8deg"],
  });
  const cardScale = panValue.interpolate({
    extrapolate: "clamp",
    inputRange: [-swipeRequiredDistance, 0, swipeRequiredDistance],
    outputRange: [0.97, 1, 0.97],
  });
  const exitOpacity = panValue.interpolate({
    extrapolate: "clamp",
    inputRange: [
      -(width + 140),
      -swipeRequiredDistance,
      0,
      swipeRequiredDistance,
      width + 140,
    ],
    outputRange: [0, 1, 1, 1, 0],
  });
  const entryOpacity = entryValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const entryTranslateY = entryValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });
  const entryScale = entryValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={styles.stage}>
      <View style={styles.timerHeader}>
        <Text
          style={[
            styles.teamPill,
            { color: palette.onTint, backgroundColor: palette.tint },
          ]}
        >
          {currentTeam.name}
        </Text>
        <Text
          style={[
            styles.timerText,
            { color: isTimerDone ? "#D92D20" : palette.text },
          ]}
        >
          {formatTimer(remainingSeconds)}
        </Text>
      </View>
      {isTimerDone ? (
        <Text style={[styles.lastWordHint, { color: palette.tint }]}>
          {t("alias.game.lastWord")}
        </Text>
      ) : null}
      <View style={styles.wordCardShell}>
        <PanGestureHandler
          activeOffsetX={[-2, 2]}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={handleGestureStateChange}
        >
          <Animated.View
            style={[
              styles.wordCard,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                opacity: Animated.multiply(exitOpacity, entryOpacity),
                transform: [
                  { translateX: panValue },
                  { translateY: entryTranslateY },
                  { rotate },
                  { scale: cardScale },
                  { scale: entryScale },
                ],
              },
            ]}
          >
            <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
              {t("alias.game.word")}
            </Text>
            <Text style={[styles.wordText, { color: palette.text }]}>
              {getLocalizedText(currentWord.text, language)}
            </Text>
          </Animated.View>
        </PanGestureHandler>
      </View>
      <View style={styles.roundButtons}>
        <Pressable
          accessibilityRole="button"
          onPress={() => animateDecision("fail")}
          style={({ pressed }) => [
            styles.resultButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <MaterialIcons color="#D92D20" name="close" size={24} />
          <Text style={[styles.resultButtonText, { color: palette.text }]}>
            {t("alias.game.fail")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => animateDecision("success")}
          style={({ pressed }) => [
            styles.resultButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <MaterialIcons color="#039855" name="check" size={24} />
          <Text style={[styles.resultButtonText, { color: palette.text }]}>
            {t("alias.game.success")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SummaryStage({
  game,
  language,
  onContinue,
  onToggleWord,
  palette,
  t,
}: {
  game: AliasActiveGame;
  language: "en" | "uk";
  onContinue: () => void;
  onToggleWord: (wordResultId: string) => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const round = game.currentRound;

  if (!round) {
    return null;
  }

  const stats = calculateAliasRoundStats(round.wordResults, game.settings);
  const team = game.teams.find((item) => item.id === round.teamId);

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
          {team?.name ?? t("games.alias.title")}
        </Text>
        <Text style={[styles.teamTitle, { color: palette.text }]}>
          {t("alias.summary.title")}
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            label={t("alias.summary.success")}
            palette={palette}
            value={stats.successCount}
          />
          <StatCard
            label={t("alias.summary.fail")}
            palette={palette}
            value={stats.failCount}
          />
          <StatCard
            label={t("alias.summary.roundScore")}
            palette={palette}
            value={stats.roundScore}
          />
        </View>
      </View>
      <View style={styles.wordTable}>
        {round.wordResults.map((wordResult) => {
          const word = getAliasWordById(wordResult.wordId);

          return (
            <Pressable
              accessibilityRole="button"
              key={wordResult.id}
              onPress={() => onToggleWord(wordResult.id)}
              style={({ pressed }) => [
                styles.wordRow,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.wordRowText, { color: palette.text }]}>
                {word
                  ? getLocalizedText(word.text, language)
                  : wordResult.wordId}
              </Text>
              <View
                style={[
                  styles.resultBadge,
                  {
                    backgroundColor:
                      wordResult.result === "success" ? "#039855" : "#D92D20",
                  },
                ]}
              >
                <Text style={styles.resultBadgeText}>
                  {wordResult.result === "success"
                    ? t("alias.game.success")
                    : t("alias.game.fail")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton
        label={t("alias.summary.nextTeam")}
        onPress={onContinue}
        palette={palette}
      />
    </View>
  );
}

function StatCard({
  label,
  palette,
  value,
}: {
  label: string;
  palette: Palette;
  value: number;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: palette.surface }]}>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.mutedText }]}>
        {label}
      </Text>
    </View>
  );
}

function WinnerStage({
  game,
  onNewGame,
  palette,
  t,
}: {
  game: AliasActiveGame;
  onNewGame: () => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const winner = game.teams.find((team) => team.id === game.winnerTeamId);

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.winnerPanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Confetti />
        <MaterialIcons color={palette.tint} name="emoji-events" size={48} />
        <Text style={[styles.teamTitle, { color: palette.text }]}>
          {t("alias.winner.title")}
        </Text>
        <Text style={[styles.wordTextSmall, { color: palette.tint }]}>
          {winner?.name ?? t("games.alias.title")}
        </Text>
      </View>
      <Scoreboard game={game} palette={palette} />
      <PrimaryButton
        label={t("alias.winner.newGame")}
        onPress={onNewGame}
        palette={palette}
      />
    </View>
  );
}

function Confetti() {
  const particles = useRef(
    Array.from({ length: 18 }, (_item, index) => ({
      id: index,
      progress: new Animated.Value(0),
      x: (index % 6) * 42 - 105,
      delay: index * 70,
      color: ["#F04438", "#FDB022", "#12B76A", "#2E90FA", "#9E77ED"][index % 5],
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((particle) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(particle.delay),
          Animated.timing(particle.progress, {
            duration: 1600,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(particle.progress, {
            duration: 0,
            toValue: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );

    Animated.parallel(animations).start();

    return () => {
      for (const animation of animations) {
        animation.stop();
      }
    };
  }, [particles]);

  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {particles.map((particle) => {
        const translateY = particle.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 190],
        });
        const rotate = particle.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "220deg"],
        });
        const opacity = particle.progress.interpolate({
          inputRange: [0, 0.15, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: particle.color,
                opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
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
  headerText: {
    flex: 1,
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
  panel: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    overflow: "hidden",
    padding: 20,
    width: "100%",
  },
  cardEyebrow: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
    textTransform: "uppercase",
  },
  teamTitle: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center",
  },
  scoreboard: {
    gap: 8,
    width: "100%",
  },
  scoreRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  scoreTeam: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: "900",
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
  timerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    width: "100%",
  },
  teamPill: {
    borderRadius: 999,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timerText: {
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 36,
  },
  lastWordHint: {
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  wordCardShell: {
    minHeight: 280,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  wordCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    minHeight: 280,
    justifyContent: "center",
    padding: 24,
    width: "100%",
  },
  wordText: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 52,
    textAlign: "center",
  },
  wordTextSmall: {
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
    textAlign: "center",
  },
  roundButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  resultButton: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: "900",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  statCard: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    gap: 4,
    minHeight: 78,
    justifyContent: "center",
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  wordTable: {
    gap: 8,
    width: "100%",
  },
  wordRow: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
    padding: 10,
  },
  wordRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  resultBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
  winnerPanel: {
    minHeight: 230,
    position: "relative",
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  confettiPiece: {
    borderRadius: 2,
    height: 14,
    position: "absolute",
    top: 0,
    width: 8,
  },
});
