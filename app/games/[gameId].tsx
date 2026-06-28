import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeaderInfoButton } from "@/components/header-info-button";
import { HeaderSettingsButton } from "@/components/header-settings-button";
import { Colors } from "@/constants/theme";
import { usePreferences } from "@/contexts/preferences-context";
import { getGameById } from "@/data/games";
import { GameRulesModal } from "@/features/game-rules-modal";
import { MafiaSetupScreen } from "@/features/mafia/mafia-setup-screen";
import { SpySetupScreen } from "@/features/spy/spy-setup-screen";

export default function GameScreen() {
  const { gameId } = useLocalSearchParams<{ gameId?: string | string[] }>();
  const normalizedGameId = Array.isArray(gameId) ? gameId[0] : gameId;
  const game = normalizedGameId ? getGameById(normalizedGameId) : undefined;
  const { effectiveTheme, t } = usePreferences();
  const palette = Colors[effectiveTheme];
  const [isRulesVisible, setIsRulesVisible] = useState(false);

  if (!game) {
    return (
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.screen, { backgroundColor: palette.background }]}
      >
        <Stack.Screen options={{ title: t("game.notFoundTitle") }} />
        <View style={styles.content}>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
              },
            ]}
          >
            <Text style={[styles.title, { color: palette.text }]}>
              {t("game.notFoundTitle")}
            </Text>
            <Text style={[styles.body, { color: palette.mutedText }]}>
              {t("game.notFoundBody")}
            </Text>
            <Link href="/" style={[styles.link, { color: palette.tint }]}>
              {t("common.backHome")}
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (game.id === "mafia") {
    return (
      <>
        <Stack.Screen
          options={{
            title: t(game.titleKey),
            headerRight: () => (
              <View style={styles.headerActions}>
                <HeaderInfoButton onPress={() => setIsRulesVisible(true)} />
                <HeaderSettingsButton />
              </View>
            ),
          }}
        />
        <MafiaSetupScreen />
        <GameRulesModal
          gameId={game.id}
          onClose={() => setIsRulesVisible(false)}
          palette={palette}
          t={t}
          visible={isRulesVisible}
        />
      </>
    );
  }

  if (game.id === "spy") {
    return (
      <>
        <Stack.Screen
          options={{
            title: t(game.titleKey),
            headerRight: () => (
              <View style={styles.headerActions}>
                <HeaderInfoButton onPress={() => setIsRulesVisible(true)} />
                <HeaderSettingsButton />
              </View>
            ),
          }}
        />
        <SpySetupScreen />
        <GameRulesModal
          gameId={game.id}
          onClose={() => setIsRulesVisible(false)}
          palette={palette}
          t={t}
          visible={isRulesVisible}
        />
      </>
    );
  }

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <Stack.Screen
        options={{
          title: t(game.titleKey),
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderInfoButton onPress={() => setIsRulesVisible(true)} />
              <HeaderSettingsButton />
            </View>
          ),
        }}
      />
      <View style={styles.content}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: palette.tint }]}>
            {t(game.playersKey)}
          </Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {t(game.titleKey)}
          </Text>
          <Text style={[styles.body, { color: palette.mutedText }]}>
            {t(game.descriptionKey)}
          </Text>
        </View>

        <View
          style={[
            styles.panel,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.placeholderTitle, { color: palette.text }]}>
            {t("game.placeholderTitle")}
          </Text>
          <Text style={[styles.body, { color: palette.mutedText }]}>
            {t("game.placeholderBody")}
          </Text>
        </View>
      </View>
      <GameRulesModal
        gameId={game.id}
        onClose={() => setIsRulesVisible(false)}
        palette={palette}
        t={t}
        visible={isRulesVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  content: {
    gap: 16,
    padding: 20,
  },
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  link: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 24,
  },
});
