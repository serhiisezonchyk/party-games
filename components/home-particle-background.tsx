import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

type ThemeMode = "light" | "dark";

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

export function HomeParticleBackground({ theme }: { theme: ThemeMode }) {
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
    <View pointerEvents="none" style={styles.layer}>
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

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: "absolute",
  },
});
