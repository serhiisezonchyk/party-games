import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { games } from "@/data/games";

export default function HomeScreen() {
  const router = useRouter();
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.title, { color: palette.text }]}>
            {t("home.title")}
          </Text>
          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            {t("home.subtitle")}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            {t("home.availableGames")}
          </Text>
          <Text style={[styles.count, { color: palette.mutedText }]}>
            {games.length}
          </Text>
        </View>

        <View style={styles.list}>
          {games.map((game) => (
            <Pressable
              accessibilityLabel={`${t("home.openGame")}: ${t(game.titleKey)}`}
              accessibilityRole="button"
              key={game.id}
              onPress={() =>
                router.push({
                  pathname: "/games/[gameId]",
                  params: { gameId: game.id },
                })
              }
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  opacity: pressed ? 0.78 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <View style={styles.cardText}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: palette.text }]}>
                    {t(game.titleKey)}
                  </Text>
                  <Text style={[styles.players, { color: palette.tint }]}>
                    {t(game.playersKey)}
                  </Text>
                </View>
                <Text
                  style={[styles.cardDescription, { color: palette.mutedText }]}
                >
                  {t(game.descriptionKey)}
                </Text>
              </View>
              <View
                style={[styles.chevron, { backgroundColor: palette.surface }]}
              >
                <MaterialIcons
                  color={palette.text}
                  name="chevron-right"
                  size={24}
                />
              </View>
            </Pressable>
          ))}
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
    gap: 28,
    padding: 20,
    paddingBottom: 36,
  },
  hero: {
    gap: 10,
    paddingTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    maxWidth: 360,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  count: {
    fontSize: 15,
    fontWeight: "700",
  },
  list: {
    gap: 14,
  },
  card: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    minHeight: 124,
    padding: 18,
  },
  cardText: {
    flex: 1,
    gap: 10,
  },
  cardTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  players: {
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  chevron: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
