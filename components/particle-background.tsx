import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type ThemeMode = "light" | "dark";

interface ParticleBackgroundProps {
  theme: ThemeMode;
}

const particleColors = [
  "#8B5CF6",
  "#22D3EE",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#3B82F6",
  "#F97316",
  "#A855F7",
] as const;

const particles = Array.from({ length: 44 }, (_, index) => {
  const column = (index * 29) % 101;
  const row = (index * 17) % 101;
  const size = 2 + ((index * 7) % 9);

  return {
    id: `settings-particle-${index}`,
    color: particleColors[index % particleColors.length],
    left: `${column}%` as `${number}%`,
    size,
    top: `${row}%` as `${number}%`,
    travel: 38 + ((index * 11) % 42),
  };
});

export function ParticleBackground({ theme }: ParticleBackgroundProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const particleOpacity = theme === "dark" ? 0.42 : 0.3;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 18_000,
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
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((particle, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const translateY = progress.interpolate({
          inputRange: [0, 0.28, 0.62, 1],
          outputRange: [0, particle.travel * -0.55, particle.travel * 0.45, 0],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 0.35, 0.72, 1],
          outputRange: [0, direction * 14, direction * -9, 0],
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
                  { rotate: index % 4 === 0 ? "45deg" : "0deg" },
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

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: "absolute",
  },
});
