import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderSettingsButton } from "@/components/header-settings-button";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { type GameId, games } from "@/data/games";

const gameVisuals = {
  spy: {
    color: "#7C3AED",
    icon: "visibility",
  },
  mafia: {
    color: "#F59E0B",
    icon: "local-police",
  },
  alias: {
    color: "#14B8A6",
    icon: "chat-bubble",
  },
  "truth-or-dare": {
    color: "#EC4899",
    icon: "help",
  },
  "never-have-i-ever": {
    color: "#EF4444",
    icon: "local-bar",
  },
  "brain-on": {
    color: "#0EA5E9",
    icon: "psychology",
  },
} as const;

const titleFontFamily = "Montserrat";
const homeHeaderTitleScrollY = 190;
const introLogoTargetCenterY = 164;
const introBlankDuration = 260;
const introLogoMoveDuration = 380;
const introPartyBounceDuration = 430;
const introGamesBounceDuration = 500;

const confetti = [
  {
    id: "purple-star",
    backgroundColor: "#8B5CF6",
    borderRadius: 5,
    height: 20,
    left: "16%",
    top: 34,
    transform: [{ rotate: "24deg" }],
    width: 20,
  },
  {
    id: "blue-dot",
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    height: 12,
    left: "8%",
    top: 72,
    width: 12,
  },
  {
    id: "orange-diamond",
    backgroundColor: "#F59E0B",
    borderRadius: 6,
    height: 14,
    left: "25%",
    top: 120,
    transform: [{ rotate: "45deg" }],
    width: 14,
  },
  {
    id: "cyan-ring",
    backgroundColor: "#22D3EE",
    borderRadius: 8,
    height: 18,
    right: "13%",
    top: 162,
    transform: [{ rotate: "30deg" }],
    width: 18,
  },
  {
    id: "pink-ring",
    backgroundColor: "#EC4899",
    borderRadius: 6,
    height: 12,
    right: "24%",
    top: 126,
    transform: [{ rotate: "35deg" }],
    width: 12,
  },
  {
    id: "orange-streamer",
    backgroundColor: "#F59E0B",
    borderRadius: 4,
    height: 8,
    right: "19%",
    top: 54,
    transform: [{ rotate: "18deg" }],
    width: 40,
  },
  {
    id: "small-purple",
    backgroundColor: "#A855F7",
    borderRadius: 5,
    height: 10,
    right: "30%",
    top: 154,
    transform: [{ rotate: "45deg" }],
    width: 10,
  },
] as const;

const headerConfettiMotion = [
  {
    duration: 18_000,
    rotate: 18,
    scale: 1.08,
    x: [0, 12, -7, 16, 0],
    y: [0, -18, 9, -10, 0],
  },
  {
    duration: 22_000,
    rotate: -10,
    scale: 1.18,
    x: [0, -18, 8, -11, 0],
    y: [0, 12, -22, -6, 0],
  },
  {
    duration: 20_000,
    rotate: 24,
    scale: 1.12,
    x: [0, 9, -15, 5, 0],
    y: [0, -10, -3, 16, 0],
  },
  {
    duration: 24_000,
    rotate: -16,
    scale: 1.1,
    x: [0, -10, 14, -18, 0],
    y: [0, 16, -8, 6, 0],
  },
  {
    duration: 19_000,
    rotate: 14,
    scale: 1.16,
    x: [0, 16, -6, 11, 0],
    y: [0, -14, 12, -20, 0],
  },
  {
    duration: 26_000,
    rotate: -8,
    scale: 1.07,
    x: [0, -14, 18, -5, 0],
    y: [0, 8, -16, 14, 0],
  },
  {
    duration: 21_000,
    rotate: 20,
    scale: 1.14,
    x: [0, 7, -12, 19, 0],
    y: [0, -20, 10, -4, 0],
  },
] as const;

const backgroundParticles = [
  { id: "p01", color: "#8B5CF6", left: "6%", size: 5, top: "2%", travel: 44 },
  { id: "p02", color: "#22D3EE", left: "24%", size: 3, top: "4%", travel: 62 },
  { id: "p03", color: "#F59E0B", left: "42%", size: 4, top: "1%", travel: 52 },
  { id: "p04", color: "#EC4899", left: "67%", size: 5, top: "5%", travel: 70 },
  { id: "p05", color: "#14B8A6", left: "90%", size: 4, top: "3%", travel: 58 },
  { id: "p06", color: "#818CF8", left: "13%", size: 6, top: "11%", travel: 48 },
  { id: "p07", color: "#EF4444", left: "35%", size: 3, top: "13%", travel: 66 },
  { id: "p08", color: "#3B82F6", left: "76%", size: 4, top: "14%", travel: 54 },
  { id: "p09", color: "#A855F7", left: "4%", size: 3, top: "23%", travel: 60 },
  { id: "p10", color: "#2DD4BF", left: "28%", size: 5, top: "25%", travel: 46 },
  { id: "p11", color: "#F97316", left: "56%", size: 4, top: "22%", travel: 72 },
  { id: "p12", color: "#EC4899", left: "86%", size: 3, top: "27%", travel: 56 },
  { id: "p13", color: "#0EA5E9", left: "14%", size: 6, top: "35%", travel: 50 },
  { id: "p14", color: "#8B5CF6", left: "49%", size: 3, top: "37%", travel: 68 },
  { id: "p15", color: "#F59E0B", left: "72%", size: 5, top: "34%", travel: 44 },
  { id: "p16", color: "#14B8A6", left: "93%", size: 4, top: "39%", travel: 74 },
  { id: "p17", color: "#3B82F6", left: "9%", size: 6, top: "48%", travel: 58 },
  { id: "p18", color: "#EC4899", left: "31%", size: 4, top: "51%", travel: 64 },
  { id: "p19", color: "#F59E0B", left: "61%", size: 3, top: "49%", travel: 42 },
  { id: "p20", color: "#22D3EE", left: "82%", size: 5, top: "54%", travel: 60 },
  { id: "p21", color: "#A855F7", left: "18%", size: 4, top: "62%", travel: 70 },
  { id: "p22", color: "#14B8A6", left: "43%", size: 5, top: "66%", travel: 48 },
  { id: "p23", color: "#EF4444", left: "69%", size: 3, top: "64%", travel: 66 },
  { id: "p24", color: "#0EA5E9", left: "92%", size: 6, top: "69%", travel: 54 },
  { id: "p25", color: "#8B5CF6", left: "7%", size: 3, top: "76%", travel: 56 },
  { id: "p26", color: "#F97316", left: "27%", size: 5, top: "80%", travel: 72 },
  { id: "p27", color: "#3B82F6", left: "52%", size: 4, top: "78%", travel: 46 },
  { id: "p28", color: "#EC4899", left: "77%", size: 5, top: "83%", travel: 62 },
  { id: "p29", color: "#2DD4BF", left: "16%", size: 4, top: "91%", travel: 58 },
  { id: "p30", color: "#F59E0B", left: "39%", size: 3, top: "94%", travel: 44 },
  { id: "p31", color: "#818CF8", left: "65%", size: 6, top: "92%", travel: 68 },
  { id: "p32", color: "#14B8A6", left: "88%", size: 4, top: "96%", travel: 52 },
  { id: "p33", color: "#EC4899", left: "3%", size: 8, top: "8%", travel: 76 },
  { id: "p34", color: "#0EA5E9", left: "18%", size: 2, top: "6%", travel: 50 },
  { id: "p35", color: "#F97316", left: "51%", size: 7, top: "10%", travel: 64 },
  { id: "p36", color: "#8B5CF6", left: "81%", size: 2, top: "12%", travel: 42 },
  { id: "p37", color: "#22D3EE", left: "96%", size: 9, top: "16%", travel: 58 },
  { id: "p38", color: "#14B8A6", left: "7%", size: 2, top: "18%", travel: 70 },
  {
    id: "p39",
    color: "#F59E0B",
    left: "21%",
    size: 13,
    top: "20%",
    travel: 54,
  },
  { id: "p40", color: "#EC4899", left: "47%", size: 2, top: "29%", travel: 62 },
  {
    id: "p41",
    color: "#818CF8",
    left: "66%",
    size: 14,
    top: "30%",
    travel: 48,
  },
  { id: "p42", color: "#2DD4BF", left: "98%", size: 3, top: "33%", travel: 72 },
  {
    id: "p43",
    color: "#3B82F6",
    left: "11%",
    size: 15,
    top: "40%",
    travel: 56,
  },
  { id: "p44", color: "#A855F7", left: "24%", size: 2, top: "44%", travel: 68 },
  { id: "p45", color: "#EF4444", left: "39%", size: 7, top: "46%", travel: 46 },
  { id: "p46", color: "#0EA5E9", left: "58%", size: 2, top: "56%", travel: 76 },
  {
    id: "p47",
    color: "#F59E0B",
    left: "74%",
    size: 16,
    top: "58%",
    travel: 52,
  },
  { id: "p48", color: "#14B8A6", left: "91%", size: 2, top: "60%", travel: 60 },
  { id: "p49", color: "#EC4899", left: "5%", size: 13, top: "68%", travel: 44 },
  { id: "p50", color: "#22D3EE", left: "33%", size: 2, top: "71%", travel: 66 },
  {
    id: "p51",
    color: "#8B5CF6",
    left: "55%",
    size: 15,
    top: "73%",
    travel: 50,
  },
  { id: "p52", color: "#F97316", left: "84%", size: 3, top: "75%", travel: 74 },
  {
    id: "p53",
    color: "#3B82F6",
    left: "14%",
    size: 16,
    top: "84%",
    travel: 58,
  },
  { id: "p54", color: "#A855F7", left: "45%", size: 2, top: "86%", travel: 42 },
  {
    id: "p55",
    color: "#2DD4BF",
    left: "72%",
    size: 14,
    top: "88%",
    travel: 70,
  },
  { id: "p56", color: "#EF4444", left: "95%", size: 2, top: "90%", travel: 48 },
  { id: "p57", color: "#818CF8", left: "1%", size: 4, top: "98%", travel: 64 },
  { id: "p58", color: "#F59E0B", left: "29%", size: 8, top: "99%", travel: 54 },
  { id: "p59", color: "#0EA5E9", left: "50%", size: 2, top: "97%", travel: 76 },
  { id: "p60", color: "#EC4899", left: "78%", size: 7, top: "99%", travel: 46 },
  { id: "p61", color: "#14B8A6", left: "12%", size: 2, top: "31%", travel: 52 },
  { id: "p62", color: "#8B5CF6", left: "36%", size: 9, top: "57%", travel: 68 },
  { id: "p63", color: "#22D3EE", left: "62%", size: 2, top: "81%", travel: 56 },
  { id: "p64", color: "#F97316", left: "87%", size: 8, top: "23%", travel: 72 },
] as const;

const visibleBackgroundParticles = backgroundParticles.filter(
  (_, index) => index % 2 === 0
);

function getPlayersParts(players: string) {
  const [count, ...labelParts] = players.split(" ");

  return {
    count,
    label: labelParts.join(" "),
  };
}

function getHomePalette(theme: "light" | "dark") {
  const palette = Colors[theme];

  if (theme === "dark") {
    return {
      background: palette.background,
      card: palette.card,
      cardBorder: "rgba(255, 255, 255, 0.18)",
      cardGlassOverlay: "rgba(18, 20, 32, 0.04)",
      cardInnerBorder: "rgba(255, 255, 255, 0.16)",
      countPill: "rgba(124, 58, 237, 0.18)",
      glassControl: "rgba(255, 255, 255, 0.07)",
      luckyBorder: "#6D28D9",
      muted: palette.mutedText,
      nav: palette.background,
      shadow: "#000000",
      surface: palette.surface,
      text: palette.text,
      title: palette.text,
    };
  }

  return {
    background: palette.background,
    card: palette.card,
    cardBorder: "rgba(124, 58, 237, 0.28)",
    cardGlassOverlay: "rgba(255, 255, 255, 0.015)",
    cardInnerBorder: "rgba(255, 255, 255, 0.42)",
    countPill: "#F0E6FF",
    glassControl: "rgba(255, 255, 255, 0.28)",
    luckyBorder: "#E9D7FF",
    muted: palette.mutedText,
    nav: palette.background,
    shadow: "#B7BED0",
    surface: palette.surface,
    text: palette.text,
    title: palette.text,
  };
}

function ParticleBackground({ theme }: { theme: "light" | "dark" }) {
  const progress = useRef(new Animated.Value(0)).current;
  const particleOpacity = theme === "dark" ? 0.46 : 0.34;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 16_000,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [progress]);

  return (
    <View pointerEvents="none" style={styles.particleLayer}>
      {visibleBackgroundParticles.map((particle, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const translateY = progress.interpolate({
          inputRange: [0, 0.28, 0.62, 1],
          outputRange: [0, particle.travel * -0.55, particle.travel * 0.45, 0],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.35, 0.72, 1],
          outputRange: [0, direction * 12, direction * -8, 0],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            particleOpacity * 0.45,
            particleOpacity,
            particleOpacity * 0.45,
          ],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
                height: particle.size,
                left: particle.left,
                opacity,
                top: particle.top,
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: index % 3 === 0 ? "45deg" : "0deg" },
                ],
                width: particle.size,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function HeaderConfetti() {
  const motionValues = useRef(
    confetti.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = motionValues.map((value, index) => {
      const motion = headerConfettiMotion[index];

      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 650),
          Animated.timing(value, {
            duration: motion.duration,
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            duration: Math.round(motion.duration * 0.82),
            easing: Easing.inOut(Easing.sin),
            isInteraction: false,
            toValue: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    for (const animation of animations) {
      animation.start();
    }

    return () => {
      for (const animation of animations) {
        animation.stop();
      }
    };
  }, [motionValues]);

  return (
    <>
      {confetti.map((shape, index) => {
        const { id, ...shapeStyle } = shape;
        const baseTransform = "transform" in shape ? shape.transform : [];
        const motion = headerConfettiMotion[index];
        const progress = motionValues[index];
        const translateX = progress.interpolate({
          inputRange: [0, 0.25, 0.55, 0.78, 1],
          outputRange: [...motion.x],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.25, 0.55, 0.78, 1],
          outputRange: [...motion.y],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 0.28, 0.6, 1],
          outputRange: [
            "0deg",
            `${motion.rotate}deg`,
            `${motion.rotate * -0.6}deg`,
            "0deg",
          ],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.45, 1],
          outputRange: [1, motion.scale, 1],
        });

        return (
          <Animated.View
            key={id}
            style={[
              styles.confettiShape,
              shapeStyle,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                  { rotate },
                  ...baseTransform,
                ],
              },
            ]}
          />
        );
      })}
    </>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const homePalette = getHomePalette(effectiveTheme);
  const [isHeaderTitleVisible, setIsHeaderTitleVisible] = useState(false);
  const [shouldRenderIntro, setShouldRenderIntro] = useState(true);
  const [introScreenHeight, setIntroScreenHeight] = useState(0);
  const isHeaderTitleVisibleRef = useRef(false);
  const introProgress = useRef(new Animated.Value(0)).current;
  const introPartyProgress = useRef(new Animated.Value(0)).current;
  const introGamesProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldRenderIntro || introScreenHeight <= 0) {
      return;
    }

    introProgress.setValue(0);
    introPartyProgress.setValue(0);
    introGamesProgress.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(introBlankDuration),
      Animated.timing(introPartyProgress, {
        duration: introPartyBounceDuration,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(introGamesProgress, {
        duration: introGamesBounceDuration,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.delay(90),
      Animated.timing(introProgress, {
        duration: introLogoMoveDuration,
        easing: Easing.out(Easing.cubic),
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    const finishIntro = () => {
      setShouldRenderIntro(false);
    };
    const fallbackTimer = setTimeout(
      finishIntro,
      introBlankDuration +
        introPartyBounceDuration +
        introGamesBounceDuration +
        introLogoMoveDuration +
        500
    );

    animation.start(({ finished }) => {
      if (!finished) {
        return;
      }

      clearTimeout(fallbackTimer);
      finishIntro();
    });

    return () => {
      clearTimeout(fallbackTimer);
      animation.stop();
    };
  }, [
    introGamesProgress,
    introPartyProgress,
    introProgress,
    introScreenHeight,
    shouldRenderIntro,
  ]);

  function openGame(gameId: GameId) {
    router.push({
      pathname: "/games/[gameId]",
      params: { gameId },
    });
  }

  function openRandomGame() {
    const randomGame = games[Math.floor(Math.random() * games.length)];
    openGame(randomGame.id);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const shouldShowTitle =
      event.nativeEvent.contentOffset.y >= homeHeaderTitleScrollY;

    if (shouldShowTitle === isHeaderTitleVisibleRef.current) {
      return;
    }

    isHeaderTitleVisibleRef.current = shouldShowTitle;
    setIsHeaderTitleVisible(shouldShowTitle);
  }

  function handleIntroLayout(event: LayoutChangeEvent) {
    const nextHeight = event.nativeEvent.layout.height;

    setIntroScreenHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight
    );
  }

  const introTranslateY = introProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, introLogoTargetCenterY - introScreenHeight / 2],
  });
  const introScale = introProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1],
  });
  const introBackdropOpacity = introProgress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [1, 0.9, 0],
  });
  const introPartyOpacity = introPartyProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 1, 1],
  });
  const introPartyScale = introPartyProgress.interpolate({
    inputRange: [0, 0.52, 0.78, 1],
    outputRange: [0.2, 1.26, 0.94, 1],
  });
  const introPartyTranslateY = introPartyProgress.interpolate({
    inputRange: [0, 0.52, 0.78, 1],
    outputRange: [78, -18, 6, 0],
  });
  const introGamesOpacity = introGamesProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0, 1, 1],
  });
  const introGamesScale = introGamesProgress.interpolate({
    inputRange: [0, 0.52, 0.78, 1],
    outputRange: [0.2, 1.24, 0.94, 1],
  });
  const introGamesTranslateY = introGamesProgress.interpolate({
    inputRange: [0, 0.52, 0.78, 1],
    outputRange: [180, -22, 8, 0],
  });

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: homePalette.background }]}
    >
      <Stack.Screen
        options={{
          headerRight: shouldRenderIntro
            ? undefined
            : () => (
                <HeaderSettingsButton
                  backgroundColor={homePalette.background}
                  iconColor={homePalette.text}
                />
              ),
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: titleFontFamily,
            fontSize: 17,
            fontWeight: "800",
          },
          headerStyle: { backgroundColor: homePalette.background },
          headerShown: true,
          headerTintColor: homePalette.text,
          title: isHeaderTitleVisible ? t("app.name") : "",
        }}
      />
      <ParticleBackground theme={effectiveTheme} />
      <ScrollView
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
      >
        <View style={styles.hero}>
          {/* <HeaderConfetti /> */}

          <View
            style={[
              styles.brand,
              shouldRenderIntro ? styles.brandHidden : null,
            ]}
          >
            <Animated.Text
              style={[
                styles.titleTop,
                {
                  color: homePalette.title,
                  opacity: introPartyOpacity,
                  transform: [
                    { translateY: introPartyTranslateY },
                    { scale: introPartyScale },
                  ],
                },
              ]}
            >
              PARTY
            </Animated.Text>
            <Animated.Text
              style={[
                styles.titleBottom,
                {
                  opacity: introGamesOpacity,
                  transform: [
                    { translateY: introGamesTranslateY },
                    { scale: introGamesScale },
                  ],
                },
              ]}
            >
              GAMES
            </Animated.Text>
            <Text style={[styles.subtitle, { color: homePalette.muted }]}>
              {t("home.subtitle")}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor:
                    effectiveTheme === "dark" ? "#2A1148" : "#EEE4FF",
                },
              ]}
            >
              <MaterialIcons color="#8B5CF6" name="sports-esports" size={25} />
            </View>
            <Text style={[styles.sectionTitle, { color: homePalette.text }]}>
              {t("home.chooseGame")}
            </Text>
          </View>
          <View
            style={[
              styles.countPill,
              { backgroundColor: homePalette.countPill },
            ]}
          >
            <Text style={styles.countText}>
              {t("home.gameCount").replace("{count}", String(games.length))}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {games.map((game) => {
            const visual = gameVisuals[game.id];
            const players = getPlayersParts(t(game.playersKey));

            return (
              <Pressable
                accessibilityLabel={`${t("home.openGame")}: ${t(game.titleKey)}`}
                accessibilityRole="button"
                key={game.id}
                onPress={() => openGame(game.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: "transparent",
                    borderColor: homePalette.cardBorder,
                    opacity: pressed ? 0.78 : 1,
                    shadowColor: homePalette.shadow,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <BlurView
                  blurReductionFactor={1}
                  experimentalBlurMethod="dimezisBlurView"
                  intensity={30}
                  pointerEvents="none"
                  style={styles.cardBlur}
                  tint={effectiveTheme === "dark" ? "dark" : "light"}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.cardInnerBorder,
                    { borderColor: homePalette.cardInnerBorder },
                  ]}
                />
                <View
                  style={[
                    styles.gameIconBox,
                    {
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? `${visual.color}20`
                          : `${visual.color}0F`,
                      borderColor:
                        effectiveTheme === "dark"
                          ? `${visual.color}45`
                          : `${visual.color}28`,
                    },
                  ]}
                >
                  <MaterialIcons
                    color={effectiveTheme === "dark" ? "#FFFFFF" : visual.color}
                    name={visual.icon}
                    size={54}
                  />
                </View>

                <View style={styles.cardText}>
                  <Text
                    numberOfLines={1}
                    style={[styles.cardTitle, { color: homePalette.text }]}
                  >
                    {t(game.titleKey)}
                  </Text>
                  <Text
                    numberOfLines={3}
                    style={[
                      styles.cardDescription,
                      { color: homePalette.muted },
                    ]}
                  >
                    {t(game.descriptionKey)}
                  </Text>
                </View>

                <View style={styles.playerColumn}>
                  <Text style={[styles.playerCount, { color: visual.color }]}>
                    {players.count}
                  </Text>
                  <Text
                    style={[styles.playerLabel, { color: homePalette.muted }]}
                  >
                    {players.label}
                  </Text>
                  <View
                    style={[
                      styles.chevron,
                      {
                        backgroundColor: homePalette.glassControl,
                        shadowColor: homePalette.shadow,
                      },
                    ]}
                  >
                    <MaterialIcons
                      color={visual.color}
                      name="chevron-right"
                      size={30}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityLabel={t("home.randomGame")}
          accessibilityRole="button"
          onPress={openRandomGame}
          style={({ pressed }) => [
            styles.luckyPanel,
            {
              backgroundColor:
                effectiveTheme === "dark"
                  ? "rgba(16, 10, 30, 0.88)"
                  : "#FBF9FF",
              borderColor: homePalette.luckyBorder,
              opacity: pressed ? 0.78 : 1,
              shadowColor: homePalette.shadow,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View style={styles.luckyArt}>
            <View style={[styles.sparkle, styles.sparkleTopLeft]} />
            <View style={[styles.sparkle, styles.sparkleTopRight]} />
            <View style={[styles.sparkle, styles.sparkleBottomLeft]} />
            <View style={[styles.sparkle, styles.sparkleBottomRight]} />
            <View style={styles.luckyDice}>
              <FontAwesome6 color="#FFFFFF" name="dice-five" size={58} />
            </View>
          </View>
          <View style={styles.luckyCopy}>
            <Text style={[styles.luckyTitle, { color: homePalette.text }]}>
              {t("home.feelingLucky")}
            </Text>
            <Text style={[styles.luckyBody, { color: homePalette.muted }]}>
              {t("home.luckyDescription")}
            </Text>
          </View>
          <View style={styles.randomButton}>
            <MaterialIcons color="#FFFFFF" name="shuffle" size={26} />
          </View>
        </Pressable>
      </ScrollView>

      {shouldRenderIntro ? (
        <View
          onLayout={handleIntroLayout}
          pointerEvents="auto"
          style={styles.introOverlay}
        >
          <Animated.View
            style={[
              styles.introBackdrop,
              {
                backgroundColor: homePalette.background,
                opacity: introBackdropOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.introLogo,
              {
                transform: [
                  { translateY: introTranslateY },
                  { scale: introScale },
                ],
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.titleTop,
                {
                  color: homePalette.title,
                  opacity: introPartyOpacity,
                  transform: [
                    { translateY: introPartyTranslateY },
                    { scale: introPartyScale },
                  ],
                },
              ]}
            >
              PARTY
            </Animated.Text>
            <Animated.Text
              style={[
                styles.titleBottom,
                {
                  opacity: introGamesOpacity,
                  transform: [
                    { translateY: introGamesTranslateY },
                    { scale: introGamesScale },
                  ],
                },
              ]}
            >
              GAMES
            </Animated.Text>
          </Animated.View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
  },
  particleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: "absolute",
  },
  scrollArea: {
    zIndex: 1,
  },
  content: {
    gap: 22,
    padding: 20,
    paddingBottom: 26,
    position: "relative",
  },
  hero: {
    minHeight: 280,
    paddingTop: 22,
    zIndex: 1,
  },
  confettiShape: {
    position: "absolute",
  },
  brand: {
    alignItems: "center",
    gap: 2,
    paddingTop: 58,
  },
  brandHidden: {
    opacity: 0,
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  introBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  introLogo: {
    alignItems: "center",
    gap: 2,
  },
  titleTop: {
    fontFamily: titleFontFamily,
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 60,
    textAlign: "center",
  },
  titleBottom: {
    color: "#8B5CF6",
    fontFamily: titleFontFamily,
    fontSize: 58,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 64,
    textAlign: "center",
    textShadowColor: "rgba(139, 92, 246, 0.26)",
    textShadowOffset: { height: 7, width: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 30,
    marginTop: 14,
    maxWidth: 330,
    textAlign: "center",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 1,
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    flexShrink: 1,
  },
  sectionIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 29,
  },
  countPill: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  countText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  list: {
    gap: 12,
    zIndex: 1,
  },
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 16,
    minHeight: 126,
    overflow: "hidden",
    padding: 14,
    position: "relative",
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
  },
  cardBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  cardGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 1,
  },
  gameIconBox: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    width: "20%",
  },
  cardText: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: "800",
    lineHeight: 29,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 19,
  },
  playerColumn: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: 58,
  },
  playerCount: {
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 29,
  },
  playerLabel: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 12,
  },
  chevron: {
    alignItems: "center",
    borderRadius: 28,
    elevation: 2,
    height: 56,
    justifyContent: "center",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    width: 56,
  },
  luckyPanel: {
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    flexDirection: "row",
    gap: 12,
    minHeight: 122,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    zIndex: 1,
  },
  luckyArt: {
    alignItems: "center",
    height: 88,
    justifyContent: "center",
    position: "relative",
    width: 82,
  },
  luckyDice: {
    alignItems: "center",
    height: 70,
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    transform: [{ rotate: "12deg" }],
    width: 70,
  },
  sparkle: {
    borderRadius: 4,
    height: 12,
    position: "absolute",
    transform: [{ rotate: "45deg" }],
    width: 12,
  },
  sparkleTopLeft: {
    backgroundColor: "#E879F9",
    left: 8,
    top: 8,
  },
  sparkleTopRight: {
    backgroundColor: "#2DD4BF",
    right: 0,
    top: 14,
  },
  sparkleBottomLeft: {
    backgroundColor: "#818CF8",
    bottom: 14,
    left: 4,
  },
  sparkleBottomRight: {
    backgroundColor: "#EC4899",
    bottom: 18,
    right: 14,
  },
  luckyCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  luckyTitle: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 24,
  },
  luckyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  randomButton: {
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 26,
    justifyContent: "center",
    minHeight: 54,
    width: 78,
  },
});
