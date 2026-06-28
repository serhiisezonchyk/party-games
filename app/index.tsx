import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
      cardBorder: palette.border,
      countPill: "rgba(124, 58, 237, 0.18)",
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
    cardBorder: palette.border,
    countPill: "#F0E6FF",
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
          headerRight: () => (
            <HeaderSettingsButton
              backgroundColor={homePalette.background}
              iconColor={homePalette.text}
            />
          ),
          headerStyle: { backgroundColor: homePalette.background },
          headerShown: true,
          headerTintColor: homePalette.text,
          title: "",
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {confetti.map(({ id, ...shapeStyle }) => (
            <View key={id} style={[styles.confettiShape, shapeStyle]} />
          ))}

          <View style={styles.brand}>
            <Text style={[styles.titleTop, { color: homePalette.title }]}>
              PARTY
            </Text>
            <Text style={styles.titleBottom}>GAMES</Text>
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
                    backgroundColor: homePalette.card,
                    borderColor: homePalette.cardBorder,
                    opacity: pressed ? 0.78 : 1,
                    shadowColor: homePalette.shadow,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.gameIconBox,
                    {
                      backgroundColor:
                        effectiveTheme === "dark"
                          ? `${visual.color}25`
                          : `${visual.color}14`,
                      borderColor:
                        effectiveTheme === "dark"
                          ? `${visual.color}60`
                          : "transparent",
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
                        backgroundColor: homePalette.surface,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    gap: 22,
    padding: 20,
    paddingBottom: 26,
  },
  hero: {
    minHeight: 280,
    paddingTop: 22,
  },
  confettiShape: {
    position: "absolute",
  },
  brand: {
    alignItems: "center",
    gap: 2,
    paddingTop: 58,
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
  },
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    gap: 16,
    minHeight: 126,
    padding: 14,
    shadowOffset: { height: 7, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
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
