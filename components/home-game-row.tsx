import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BlurView } from "expo-blur";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ThemeMode = "light" | "dark";

export interface HomeGameRowPalette {
  cardBorder: string;
  cardInnerBorder: string;
  glassControl: string;
  muted: string;
  shadow: string;
  text: string;
}

export interface HomeGameRowPlayers {
  count: string;
  label: string;
}

export interface HomeGameRowVisual {
  color: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
}

interface HomeGameRowProps {
  accessibilityLabel: string;
  description: string;
  onPress: () => void;
  palette: HomeGameRowPalette;
  players: HomeGameRowPlayers;
  theme: ThemeMode;
  title: string;
  visual: HomeGameRowVisual;
}

export function HomeGameRow({
  accessibilityLabel,
  description,
  onPress,
  palette,
  players,
  theme,
  title,
  visual,
}: HomeGameRowProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: "transparent",
          borderColor: palette.cardBorder,
          opacity: pressed ? 0.78 : 1,
          shadowColor: palette.shadow,
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
        tint={theme === "dark" ? "dark" : "light"}
      />
      <View
        pointerEvents="none"
        style={[
          styles.cardInnerBorder,
          { borderColor: palette.cardInnerBorder },
        ]}
      />
      <View
        style={[
          styles.gameIconBox,
          {
            backgroundColor:
              theme === "dark" ? `${visual.color}20` : `${visual.color}0F`,
            borderColor:
              theme === "dark" ? `${visual.color}45` : `${visual.color}28`,
          },
        ]}
      >
        <MaterialIcons
          color={theme === "dark" ? "#FFFFFF" : visual.color}
          name={visual.icon}
          size={54}
        />
      </View>

      <View style={styles.cardText}>
        <Text
          numberOfLines={1}
          style={[styles.cardTitle, { color: palette.text }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={3}
          style={[styles.cardDescription, { color: palette.muted }]}
        >
          {description}
        </Text>
      </View>

      <View style={styles.playerColumn}>
        <Text style={[styles.playerCount, { color: visual.color }]}>
          {players.count}
        </Text>
        <Text style={[styles.playerLabel, { color: palette.muted }]}>
          {players.label}
        </Text>
        <View
          style={[
            styles.chevron,
            {
              backgroundColor: palette.glassControl,
              shadowColor: palette.shadow,
            },
          ]}
        >
          <MaterialIcons color={visual.color} name="chevron-right" size={30} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  cardDescription: {
    fontSize: 14,
    lineHeight: 19,
  },
  cardInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 1,
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
  gameIconBox: {
    alignItems: "center",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    width: "20%",
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
});
