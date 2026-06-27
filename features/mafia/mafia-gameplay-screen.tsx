import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { NightAttackResolution } from "@/features/mafia/game-engine";
import {
  createVotes,
  eliminatePlayer,
  finishGameIfWon,
  getAlivePlayers,
  getDonResultKey,
  getHomelessResultKey,
  getNightResolution,
  getNightScriptSteps,
  getPlayerById,
  getRoleDescriptionKey,
  getRoleTitleKey,
  getSheriffResultKey,
  getTargetOptions,
  getUniqueNominations,
  isNightActionBlocked,
  resolveNightActions,
  resolveVotes,
  roleIcons,
  startNextNight,
} from "@/features/mafia/game-engine";
import {
  clearActiveMafiaGame,
  loadActiveMafiaGame,
  saveActiveMafiaGame,
} from "@/features/mafia/storage";
import type {
  MafiaActiveGame,
  MafiaNightActionKey,
  MafiaScriptStep,
} from "@/features/mafia/types";
import type { TranslationKey } from "@/i18n/translations";

type Palette = (typeof Colors)["light"];

type GameUpdater =
  | MafiaActiveGame
  | ((game: MafiaActiveGame) => MafiaActiveGame);

function getPlayerName(game: MafiaActiveGame, participantId: string) {
  return getPlayerById(game, participantId)?.participant.name ?? participantId;
}

function getOptionalPlayerName(game: MafiaActiveGame, participantId?: string) {
  return participantId ? getPlayerName(game, participantId) : "";
}

function getResultKey(game: MafiaActiveGame, step: MafiaScriptStep) {
  if (step.resultType === "don") {
    return getDonResultKey(game, game.nightActions.donTargetId);
  }

  if (step.resultType === "sheriff") {
    return getSheriffResultKey(game, game.nightActions.sheriffTargetId);
  }

  if (step.resultType === "homeless") {
    return getHomelessResultKey(game, game.nightActions.homelessTargetId);
  }

  return;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatTemplate(
  template: string,
  values: Record<string, string | number>
) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function formatTargetSummary({
  fallbackKey,
  game,
  t,
  targetId,
  templateKey,
}: {
  fallbackKey: TranslationKey;
  game: MafiaActiveGame;
  t: (key: TranslationKey) => string;
  targetId?: string;
  templateKey: TranslationKey;
}) {
  if (!targetId) {
    return t(fallbackKey);
  }

  return formatTemplate(t(templateKey), {
    name: getPlayerName(game, targetId),
  });
}

function formatAttackOutcome({
  attack,
  blockedKey,
  game,
  killedKey,
  noTargetKey,
  savedKey,
  t,
}: {
  attack?: NightAttackResolution;
  blockedKey: TranslationKey;
  game: MafiaActiveGame;
  killedKey: TranslationKey;
  noTargetKey: TranslationKey;
  savedKey: TranslationKey;
  t: (key: TranslationKey) => string;
}) {
  if (!attack?.targetId) {
    return t(noTargetKey);
  }

  if (attack.blocked) {
    return t(blockedKey);
  }

  const name = getPlayerName(game, attack.targetId);

  if (attack.protected) {
    return formatTemplate(t(savedKey), { name });
  }

  if (attack.killed) {
    return formatTemplate(t(killedKey), { name });
  }

  return t(noTargetKey);
}

function getNightStepText(
  game: MafiaActiveGame,
  step: MafiaScriptStep,
  t: (key: TranslationKey) => string
) {
  if (step.textKey) {
    return t(step.textKey);
  }

  const resolution = getNightResolution(game);

  switch (step.dynamicText) {
    case "mafiaTargetSummary":
      return formatTargetSummary({
        fallbackKey: "mafia.script.mafiaNoTarget",
        game,
        t,
        targetId: game.nightActions.mafiaTargetId,
        templateKey: "mafia.script.mafiaTargetSummary",
      });
    case "doctorTargetSummary":
      return formatTargetSummary({
        fallbackKey: "mafia.script.doctorNoTarget",
        game,
        t,
        targetId: game.nightActions.doctorTargetId,
        templateKey: isNightActionBlocked(game, "doctor")
          ? "mafia.script.doctorBlockedSummary"
          : "mafia.script.doctorTargetSummary",
      });
    case "prostituteTargetSummary":
      return formatTargetSummary({
        fallbackKey: "mafia.script.prostituteNoTarget",
        game,
        t,
        targetId: game.nightActions.prostituteTargetId,
        templateKey: "mafia.script.prostituteTargetSummary",
      });
    case "donResultSummary":
      return formatTemplate(t("mafia.script.donResultSummary"), {
        name: getOptionalPlayerName(game, game.nightActions.donTargetId),
        result: t(getDonResultKey(game, game.nightActions.donTargetId)),
      });
    case "sheriffResultSummary":
      return formatTemplate(t("mafia.script.sheriffResultSummary"), {
        name: getOptionalPlayerName(game, game.nightActions.sheriffTargetId),
        result: t(getSheriffResultKey(game, game.nightActions.sheriffTargetId)),
      });
    case "homelessResultSummary":
      return formatTemplate(t("mafia.script.homelessResultSummary"), {
        name: getOptionalPlayerName(game, game.nightActions.homelessTargetId),
        result: t(
          getHomelessResultKey(game, game.nightActions.homelessTargetId)
        ),
      });
    case "maniacTargetSummary":
      return formatTargetSummary({
        fallbackKey: "mafia.script.maniacNoTarget",
        game,
        t,
        targetId: game.nightActions.maniacTargetId,
        templateKey: "mafia.script.maniacTargetSummary",
      });
    case "mafiaOutcomeSummary":
      return formatAttackOutcome({
        attack: resolution.mafia,
        blockedKey: "mafia.script.mafiaBlockedOutcome",
        game,
        killedKey: "mafia.script.mafiaKilledOutcome",
        noTargetKey: "mafia.script.mafiaNoKillOutcome",
        savedKey: "mafia.script.mafiaSavedOutcome",
        t,
      });
    case "maniacOutcomeSummary":
      return formatAttackOutcome({
        attack: resolution.maniac,
        blockedKey: "mafia.script.maniacBlockedOutcome",
        game,
        killedKey: "mafia.script.maniacKilledOutcome",
        noTargetKey: "mafia.script.maniacNoKillOutcome",
        savedKey: "mafia.script.maniacSavedOutcome",
        t,
      });
    case "nightOutcomeSummary": {
      if (resolution.killedIds.length === 0) {
        return t("mafia.script.nobodyKilledOutcome");
      }

      return formatTemplate(t("mafia.script.playersKilledOutcome"), {
        names: resolution.killedIds
          .map((participantId) => getPlayerName(game, participantId))
          .join(", "),
      });
    }
    default:
      return "";
  }
}

export function MafiaGameplayScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const { width } = useWindowDimensions();
  const palette = Colors[effectiveTheme];
  const [game, setGame] = useState<MafiaActiveGame | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isRevealTransitioning, setIsRevealTransitioning] = useState(false);
  const [typedText, setTypedText] = useState("");
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

      saveActiveMafiaGame(nextGame).catch((error: unknown) => {
        console.warn("Failed to save active Mafia game", error);
      });

      return nextGame;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadActiveMafiaGame()
      .then((loadedGame) => {
        if (isMounted) {
          setGame(loadedGame);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        console.warn("Failed to load active Mafia game", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const nightSteps = useMemo(
    () => (game ? getNightScriptSteps(game) : []),
    [game]
  );
  const activeNightStep =
    game?.phase === "night"
      ? nightSteps[Math.min(game.scriptIndex, nightSteps.length - 1)]
      : undefined;
  const activeNightText =
    game && activeNightStep ? getNightStepText(game, activeNightStep, t) : "";

  useEffect(() => {
    if (!activeNightText) {
      return;
    }

    const fullText = activeNightText;
    let characterIndex = 0;
    setTypedText("");

    const intervalId = setInterval(() => {
      characterIndex += 1;
      setTypedText(fullText.slice(0, characterIndex));

      if (characterIndex >= fullText.length) {
        clearInterval(intervalId);
      }
    }, 26);

    return () => clearInterval(intervalId);
  }, [activeNightText]);

  useEffect(() => {
    if (game?.phase !== "roleReveal") {
      return;
    }

    setIsCardRevealed(false);
    flipValue.setValue(0);
    revealSlideValue.setValue(0);
  }, [flipValue, game?.phase, revealSlideValue]);

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
        persistGame({ ...game, phase: "leaderHandoff" });
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

  function handleNightTarget(action: MafiaNightActionKey, targetId: string) {
    persistGame((currentGame) => ({
      ...currentGame,
      nightActions: {
        ...currentGame.nightActions,
        [action]: targetId,
      },
    }));
  }

  function handleNextNightStep() {
    if (!(game && activeNightStep)) {
      return;
    }

    if (activeNightStep.action && !game.nightActions[activeNightStep.action]) {
      return;
    }

    if (game.scriptIndex < nightSteps.length - 1) {
      persistGame({ ...game, scriptIndex: game.scriptIndex + 1 });
      return;
    }

    const gameAfterNight = finishGameIfWon(resolveNightActions(game));

    persistGame(
      gameAfterNight.phase === "ended"
        ? gameAfterNight
        : {
            ...gameAfterNight,
            phase: "day",
            daySpeakerIndex: 0,
            nominations: {},
            votingCandidateIds: [],
            votes: {},
          }
    );
  }

  function handleNomination(speakerId: string, targetId?: string) {
    persistGame((currentGame) => {
      const nextNominations = { ...currentGame.nominations };

      if (targetId) {
        nextNominations[speakerId] = targetId;
      } else {
        delete nextNominations[speakerId];
      }

      return {
        ...currentGame,
        nominations: nextNominations,
      };
    });
  }

  function handleNextSpeaker() {
    if (!game) {
      return;
    }

    const aliveSpeakers = getAlivePlayers(game);

    if (game.daySpeakerIndex < aliveSpeakers.length - 1) {
      persistGame({ ...game, daySpeakerIndex: game.daySpeakerIndex + 1 });
      return;
    }

    const candidateIds = getUniqueNominations(game.nominations);

    if (candidateIds.length === 0) {
      persistGame(startNextNight(game));
      return;
    }

    persistGame({
      ...game,
      phase: "voting",
      votingCandidateIds: candidateIds,
      tiedCandidateIds: [],
      votes: createVotes(candidateIds),
    });
  }

  function handleVoteChange(candidateId: string, delta: number) {
    persistGame((currentGame) => {
      const aliveCount = getAlivePlayers(currentGame).length;
      const currentVoteCount = currentGame.votes[candidateId] ?? 0;

      return {
        ...currentGame,
        votes: {
          ...currentGame.votes,
          [candidateId]: Math.max(
            0,
            Math.min(aliveCount, currentVoteCount + delta)
          ),
        },
      };
    });
  }

  function handleResolveVoting() {
    if (!game) {
      return;
    }

    const votingResult = resolveVotes(game.votes);

    if (votingResult.type === "eliminate") {
      const gameAfterVote = finishGameIfWon(
        eliminatePlayer(game, votingResult.eliminatedId, "vote")
      );

      persistGame(
        gameAfterVote.phase === "ended"
          ? gameAfterVote
          : startNextNight(gameAfterVote)
      );
      return;
    }

    if (votingResult.type === "tie") {
      persistGame({
        ...game,
        phase: "tieSpeech",
        tiedCandidateIds: votingResult.tiedCandidateIds,
        votingCandidateIds: votingResult.tiedCandidateIds,
        tieSpeakerIndex: 0,
        votes: createVotes(votingResult.tiedCandidateIds),
      });
      return;
    }

    persistGame(startNextNight(game));
  }

  function handleNextTieSpeaker() {
    if (!game) {
      return;
    }

    if (game.tieSpeakerIndex < game.tiedCandidateIds.length - 1) {
      persistGame({ ...game, tieSpeakerIndex: game.tieSpeakerIndex + 1 });
      return;
    }

    persistGame({
      ...game,
      phase: "voting",
      votes: createVotes(game.tiedCandidateIds),
    });
  }

  async function handleEndGame() {
    await clearActiveMafiaGame();
    setGame(null);
    router.replace("/games/mafia");
  }

  if (!isLoaded) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.screen, { backgroundColor: palette.background }]}
      />
    );
  }

  if (!game) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.screen, { backgroundColor: palette.background }]}
      >
        <View style={styles.centerContent}>
          <View
            style={[
              styles.panel,
              { backgroundColor: palette.card, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.title, { color: palette.text }]}>
              {t("mafia.game.noActive.title")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("mafia.game.noActive.body")}
            </Text>
            <PrimaryButton
              label={t("mafia.game.noActive.back")}
              onPress={() => router.replace("/games/mafia")}
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
        <View style={styles.topRow}>
          <Text style={[styles.roundLabel, { color: palette.mutedText }]}>
            {t("mafia.game.round")} {game.round}
          </Text>
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
              {t("mafia.game.end")}
            </Text>
          </Pressable>
        </View>

        {game.phase === "roleReveal" ? (
          <RoleRevealStage
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

        {game.phase === "leaderHandoff" ? (
          <LeaderHandoffStage
            onContinue={() =>
              persistGame({ ...game, phase: "night", scriptIndex: 0 })
            }
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "night" && activeNightStep ? (
          <NightStage
            game={game}
            onNext={handleNextNightStep}
            onTarget={handleNightTarget}
            palette={palette}
            step={activeNightStep}
            t={t}
            typedText={typedText}
          />
        ) : null}

        {game.phase === "day" ? (
          <DayStage
            game={game}
            onNext={handleNextSpeaker}
            onNominate={handleNomination}
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "voting" ? (
          <VotingStage
            game={game}
            onChangeVote={handleVoteChange}
            onResolve={handleResolveVoting}
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "tieSpeech" ? (
          <TieSpeechStage
            game={game}
            onNext={handleNextTieSpeaker}
            palette={palette}
            t={t}
          />
        ) : null}

        {game.phase === "ended" && game.winner ? (
          <EndedStage
            game={game}
            onBackToSetup={handleEndGame}
            palette={palette}
            t={t}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleRevealStage({
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
  game: MafiaActiveGame;
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
                {t("mafia.reveal.player")}
              </Text>
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                {player.participant.name}
              </Text>
              <Text style={[styles.body, { color: palette.mutedText }]}>
                {t("mafia.reveal.tap")}
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
                name={roleIcons[player.role]}
                size={54}
              />
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                {t(getRoleTitleKey(player.role))}
              </Text>
              <Text style={[styles.body, { color: palette.mutedText }]}>
                {t(getRoleDescriptionKey(player.role))}
              </Text>
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>

      <PrimaryButton
        disabled={!isCardRevealed || isTransitioning}
        label={
          game.revealIndex >= game.players.length - 1
            ? t("mafia.reveal.finish")
            : t("mafia.reveal.next")
        }
        onPress={onNext}
        palette={palette}
      />
    </View>
  );
}

function LeaderHandoffStage({
  onContinue,
  palette,
  t,
}: {
  onContinue: () => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.largePanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <MaterialIcons
          color={palette.tint}
          name="workspace-premium"
          size={48}
        />
        <Text style={[styles.title, { color: palette.text }]}>
          {t("mafia.handoff.title")}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("mafia.handoff.body")}
        </Text>
      </View>
      <PrimaryButton
        label={t("mafia.handoff.continue")}
        onPress={onContinue}
        palette={palette}
      />
    </View>
  );
}

function NightStage({
  game,
  onNext,
  onTarget,
  palette,
  step,
  t,
  typedText,
}: {
  game: MafiaActiveGame;
  onNext: () => void;
  onTarget: (action: MafiaNightActionKey, targetId: string) => void;
  palette: Palette;
  step: MafiaScriptStep;
  t: (key: TranslationKey) => string;
  typedText: string;
}) {
  const selectedTargetId = step.action
    ? game.nightActions[step.action]
    : undefined;
  const targets = getTargetOptions(game, step.action);
  const resultKey = getResultKey(game, step);
  const canContinue = !step.action || Boolean(selectedTargetId);

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.largePanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.scriptText, { color: palette.text }]}>
          {typedText}
        </Text>
      </View>

      {step.action ? (
        <View style={styles.optionGroup}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t("mafia.night.selectTarget")}
          </Text>
          {targets.map((target) => (
            <SelectionButton
              isSelected={selectedTargetId === target.participant.id}
              key={target.participant.id}
              label={target.participant.name}
              onPress={() =>
                onTarget(
                  step.action as MafiaNightActionKey,
                  target.participant.id
                )
              }
              palette={palette}
            />
          ))}
        </View>
      ) : null}

      {resultKey && selectedTargetId ? (
        <View
          style={[
            styles.resultBox,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.resultText, { color: palette.text }]}>
            {getPlayerName(game, selectedTargetId)}: {t(resultKey)}
          </Text>
        </View>
      ) : null}

      <PrimaryButton
        disabled={!canContinue}
        label={t("mafia.game.continue")}
        onPress={onNext}
        palette={palette}
      />
    </View>
  );
}

function DayStage({
  game,
  onNext,
  onNominate,
  palette,
  t,
}: {
  game: MafiaActiveGame;
  onNext: () => void;
  onNominate: (speakerId: string, targetId?: string) => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const aliveSpeakers = getAlivePlayers(game);
  const speaker =
    aliveSpeakers[Math.min(game.daySpeakerIndex, aliveSpeakers.length - 1)];
  const selectedTargetId = speaker
    ? game.nominations[speaker.participant.id]
    : undefined;
  const nominationTargets = speaker
    ? getTargetOptions(game, undefined, speaker.participant.id)
    : [];

  if (!speaker) {
    return null;
  }

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.largePanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
          {t("mafia.day.speaker")}
        </Text>
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {speaker.participant.name}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("mafia.day.speechTime")} {game.settings.speechDurationSec}
          {t("mafia.settings.secondsShort")}
        </Text>
        <SpeechTimer
          durationSec={game.settings.speechDurationSec}
          key={`${game.round}-${speaker.participant.id}`}
          palette={palette}
          t={t}
        />
      </View>

      <View style={styles.optionGroup}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>
          {t("mafia.day.nomination")}
        </Text>
        <SelectionButton
          isSelected={!selectedTargetId}
          label={t("mafia.day.noNomination")}
          onPress={() => onNominate(speaker.participant.id)}
          palette={palette}
        />
        {nominationTargets.map((target) => (
          <SelectionButton
            isSelected={selectedTargetId === target.participant.id}
            key={target.participant.id}
            label={target.participant.name}
            onPress={() =>
              onNominate(speaker.participant.id, target.participant.id)
            }
            palette={palette}
          />
        ))}
      </View>

      <PrimaryButton
        label={
          game.daySpeakerIndex >= aliveSpeakers.length - 1
            ? t("mafia.day.startVoting")
            : t("mafia.day.nextSpeaker")
        }
        onPress={onNext}
        palette={palette}
      />
    </View>
  );
}

function SpeechTimer({
  durationSec,
  palette,
  t,
}: {
  durationSec: number;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSec);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    setRemainingSeconds(durationSec);
    setIsTimerRunning(true);
  }, [durationSec]);

  useEffect(() => {
    if (!(isTimerRunning && remainingSeconds > 0)) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTimerRunning, remainingSeconds]);

  return (
    <View
      style={[
        styles.timerBox,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Text
        style={[
          styles.timerText,
          { color: remainingSeconds === 0 ? palette.tint : palette.text },
        ]}
      >
        {formatTimer(remainingSeconds)}
      </Text>
      {remainingSeconds === 0 ? (
        <Text style={[styles.timerDoneText, { color: palette.mutedText }]}>
          {t("mafia.timer.done")}
        </Text>
      ) : null}
      <View style={styles.timerControls}>
        <IconButton
          icon={isTimerRunning ? "pause" : "play-arrow"}
          onPress={() => setIsTimerRunning((currentValue) => !currentValue)}
          palette={palette}
        />
        <IconButton
          icon="replay"
          onPress={() => {
            setRemainingSeconds(durationSec);
            setIsTimerRunning(true);
          }}
          palette={palette}
        />
      </View>
    </View>
  );
}

function VotingStage({
  game,
  onChangeVote,
  onResolve,
  palette,
  t,
}: {
  game: MafiaActiveGame;
  onChangeVote: (candidateId: string, delta: number) => void;
  onResolve: () => void;
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
        <Text style={[styles.title, { color: palette.text }]}>
          {t("mafia.voting.title")}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("mafia.voting.body")}
        </Text>
      </View>

      <View style={styles.optionGroup}>
        {game.votingCandidateIds.map((candidateId) => (
          <VoteRow
            candidateName={getPlayerName(game, candidateId)}
            key={candidateId}
            onDecrease={() => onChangeVote(candidateId, -1)}
            onIncrease={() => onChangeVote(candidateId, 1)}
            palette={palette}
            value={game.votes[candidateId] ?? 0}
          />
        ))}
      </View>

      <PrimaryButton
        label={t("mafia.voting.resolve")}
        onPress={onResolve}
        palette={palette}
      />
    </View>
  );
}

function TieSpeechStage({
  game,
  onNext,
  palette,
  t,
}: {
  game: MafiaActiveGame;
  onNext: () => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const candidateId =
    game.tiedCandidateIds[
      Math.min(game.tieSpeakerIndex, game.tiedCandidateIds.length - 1)
    ];

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.largePanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.cardEyebrow, { color: palette.tint }]}>
          {t("mafia.tie.title")}
        </Text>
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {getPlayerName(game, candidateId)}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t("mafia.tie.body")}
        </Text>
      </View>
      <PrimaryButton
        label={
          game.tieSpeakerIndex >= game.tiedCandidateIds.length - 1
            ? t("mafia.tie.voteAgain")
            : t("mafia.day.nextSpeaker")
        }
        onPress={onNext}
        palette={palette}
      />
    </View>
  );
}

function EndedStage({
  game,
  onBackToSetup,
  palette,
  t,
}: {
  game: MafiaActiveGame;
  onBackToSetup: () => void;
  palette: Palette;
  t: (key: TranslationKey) => string;
}) {
  const isMafiaWinner = game.winner === "mafia";
  const aliveMafiaCount = getAlivePlayers(game).filter(
    (player) => player.role === "mafia" || player.role === "don"
  ).length;
  const alivePlayerCount = getAlivePlayers(game).length;

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.panel,
          styles.winPanel,
          { backgroundColor: palette.card, borderColor: palette.border },
        ]}
      >
        <ConfettiBurst palette={palette} />
        <MaterialIcons
          color={palette.tint}
          name={isMafiaWinner ? "groups" : "verified"}
          size={58}
        />
        <Text style={[styles.cardTitle, { color: palette.text }]}>
          {t(
            isMafiaWinner
              ? "mafia.end.mafia.title"
              : "mafia.end.civilians.title"
          )}
        </Text>
        <Text style={[styles.body, { color: palette.mutedText }]}>
          {t(
            isMafiaWinner ? "mafia.end.mafia.body" : "mafia.end.civilians.body"
          )}
        </Text>
        <Text style={[styles.resultText, { color: palette.text }]}>
          {formatTemplate(t("mafia.end.summary"), {
            mafiaCount: aliveMafiaCount,
            playerCount: alivePlayerCount,
            round: game.round,
          })}
        </Text>
      </View>
      <PrimaryButton
        label={t("mafia.end.backToSetup")}
        onPress={onBackToSetup}
        palette={palette}
      />
    </View>
  );
}

function ConfettiBurst({ palette }: { palette: Palette }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(() => {
    const colors = [palette.tint, "#F04438", "#FDB022", "#12B76A"];

    return Array.from({ length: 28 }, (_, index) => {
      const left = `${8 + ((index * 31) % 84)}%` as `${number}%`;

      return {
        id: `confetti-${index}-${left}`,
        color: colors[index % colors.length],
        left,
        rotation: `${(index * 47) % 180}deg`,
        size: 6 + (index % 3) * 3,
        travelX: (index % 2 === 0 ? 1 : -1) * (14 + (index % 5) * 7),
        travelY: 90 + (index % 7) * 18,
      };
    });
  }, [palette.tint]);

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View style={[styles.confettiLayer, { pointerEvents: "none" }]}>
      {pieces.map((piece) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, piece.travelY],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.78, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                height: piece.size + 6,
                left: piece.left,
                opacity,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, piece.travelX],
                    }),
                  },
                  { translateY },
                  { rotate: piece.rotation },
                ],
                width: piece.size,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function SelectionButton({
  isSelected,
  label,
  onPress,
  palette,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionButton,
        {
          backgroundColor: isSelected ? palette.tint : palette.card,
          borderColor: isSelected ? palette.tint : palette.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.selectionText,
          { color: isSelected ? palette.onTint : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function VoteRow({
  candidateName,
  onDecrease,
  onIncrease,
  palette,
  value,
}: {
  candidateName: string;
  onDecrease: () => void;
  onIncrease: () => void;
  palette: Palette;
  value: number;
}) {
  return (
    <View
      style={[
        styles.voteRow,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.voteName, { color: palette.text }]}>
        {candidateName}
      </Text>
      <View style={styles.voteControls}>
        <IconButton icon="remove" onPress={onDecrease} palette={palette} />
        <Text style={[styles.voteValue, { color: palette.text }]}>{value}</Text>
        <IconButton icon="add" onPress={onIncrease} palette={palette} />
      </View>
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  palette,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <MaterialIcons color={palette.text} name={icon} size={20} />
    </Pressable>
  );
}

function PrimaryButton({
  disabled,
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
          styles.primaryText,
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 36,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roundLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
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
    fontWeight: "800",
  },
  stage: {
    gap: 16,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  largePanel: {
    alignItems: "center",
    minHeight: 280,
    justifyContent: "center",
  },
  winPanel: {
    alignItems: "center",
    minHeight: 360,
    overflow: "hidden",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  flipCardMotion: {
    width: "100%",
  },
  flipCardSlot: {
    height: 430,
  },
  roleCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    minHeight: 430,
    justifyContent: "center",
    padding: 28,
  },
  flipCardFace: {
    backfaceVisibility: "hidden",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  flipCardBack: {
    transform: [{ rotateY: "180deg" }],
  },
  cardEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    textAlign: "center",
  },
  scriptText: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
    textAlign: "center",
  },
  optionGroup: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  selectionButton: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "800",
  },
  resultBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  resultText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  confettiLayer: {
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  confettiPiece: {
    borderRadius: 2,
    position: "absolute",
    top: 18,
  },
  timerBox: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
    minWidth: 190,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  timerText: {
    fontSize: 44,
    fontWeight: "800",
    lineHeight: 50,
  },
  timerDoneText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  timerControls: {
    flexDirection: "row",
    gap: 10,
  },
  voteRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    minHeight: 64,
    paddingHorizontal: 14,
  },
  voteName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  voteControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  voteValue: {
    fontSize: 20,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 16,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
