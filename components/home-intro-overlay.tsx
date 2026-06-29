import { Animated, StyleSheet, View } from "react-native";

import type { useHomeIntroAnimation } from "@/hooks/use-home-intro-animation";

const titleFontFamily = "Montserrat";

type HomeIntroAnimation = ReturnType<typeof useHomeIntroAnimation>;

interface HomeIntroOverlayProps {
  animation: HomeIntroAnimation;
  backgroundColor: string;
  titleColor: string;
}

export function HomeIntroOverlay({
  animation,
  backgroundColor,
  titleColor,
}: HomeIntroOverlayProps) {
  if (!animation.shouldRenderIntro) {
    return null;
  }

  return (
    <View
      onLayout={animation.handleIntroLayout}
      pointerEvents="auto"
      style={styles.introOverlay}
    >
      <Animated.View
        style={[
          styles.introBackdrop,
          { backgroundColor },
          animation.backdropAnimatedStyle,
        ]}
      />
      <Animated.View style={[styles.introLogo, animation.logoAnimatedStyle]}>
        <Animated.Text
          style={[
            styles.titleTop,
            { color: titleColor },
            animation.partyTitleAnimatedStyle,
          ]}
        >
          PARTY
        </Animated.Text>
        <Animated.Text
          style={[styles.titleBottom, animation.gamesTitleAnimatedStyle]}
        >
          GAMES
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  introBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  introLogo: {
    alignItems: "center",
    gap: 2,
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
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
  titleTop: {
    fontFamily: titleFontFamily,
    fontSize: 54,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 60,
    textAlign: "center",
  },
});
