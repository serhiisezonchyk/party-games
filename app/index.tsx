import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderSettingsButton } from "@/components/header-settings-button";
import { HomeGameRow } from "@/components/home-game-row";
import { HomeIntroOverlay } from "@/components/home-intro-overlay";
import { HomeParticleBackground } from "@/components/home-particle-background";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { type GameId, games } from "@/data/games";
import { useHomeHeaderTitleVisibility } from "@/hooks/use-home-header-title-visibility";
import { useHomeIntroAnimation } from "@/hooks/use-home-intro-animation";

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

export default function HomeScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const homePalette = getHomePalette(effectiveTheme);
  const { handleScroll, isHeaderTitleVisible } = useHomeHeaderTitleVisibility();
  const introAnimation = useHomeIntroAnimation();

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

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: homePalette.background }]}
    >
      <Stack.Screen
        options={{
          headerRight: introAnimation.shouldRenderIntro
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
      <HomeParticleBackground theme={effectiveTheme} />
      <ScrollView
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.brand,
              introAnimation.shouldRenderIntro ? styles.brandHidden : null,
            ]}
          >
            <Animated.Text
              style={[
                styles.titleTop,
                {
                  color: homePalette.title,
                },
                introAnimation.partyTitleAnimatedStyle,
              ]}
            >
              PARTY
            </Animated.Text>
            <Animated.Text
              style={[
                styles.titleBottom,
                introAnimation.gamesTitleAnimatedStyle,
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
              <HomeGameRow
                accessibilityLabel={`${t("home.openGame")}: ${t(game.titleKey)}`}
                description={t(game.descriptionKey)}
                key={game.id}
                onPress={() => openGame(game.id)}
                palette={homePalette}
                players={players}
                theme={effectiveTheme}
                title={t(game.titleKey)}
                visual={visual}
              />
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

      <HomeIntroOverlay
        animation={introAnimation}
        backgroundColor={homePalette.background}
        titleColor={homePalette.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
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
  brand: {
    alignItems: "center",
    gap: 2,
    paddingTop: 58,
  },
  brandHidden: {
    opacity: 0,
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
