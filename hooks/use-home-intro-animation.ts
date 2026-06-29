import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, type LayoutChangeEvent } from "react-native";

const introLogoTargetCenterY = 164;
const introBlankDuration = 260;
const introLogoMoveDuration = 380;
const introPartyBounceDuration = 430;
const introGamesBounceDuration = 500;

export function useHomeIntroAnimation() {
  const [shouldRenderIntro, setShouldRenderIntro] = useState(true);
  const [introScreenHeight, setIntroScreenHeight] = useState(0);
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

  const handleIntroLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setIntroScreenHeight((currentHeight) =>
      currentHeight === nextHeight ? currentHeight : nextHeight
    );
  }, []);

  const introTranslateY = useMemo(
    () =>
      introProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, introLogoTargetCenterY - introScreenHeight / 2],
      }),
    [introProgress, introScreenHeight]
  );
  const introScale = useMemo(
    () =>
      introProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1.08, 1],
      }),
    [introProgress]
  );
  const introBackdropOpacity = useMemo(
    () =>
      introProgress.interpolate({
        inputRange: [0, 0.65, 1],
        outputRange: [1, 0.9, 0],
      }),
    [introProgress]
  );
  const introPartyOpacity = useMemo(
    () =>
      introPartyProgress.interpolate({
        inputRange: [0, 0.12, 1],
        outputRange: [0, 1, 1],
      }),
    [introPartyProgress]
  );
  const introPartyScale = useMemo(
    () =>
      introPartyProgress.interpolate({
        inputRange: [0, 0.52, 0.78, 1],
        outputRange: [0.2, 1.26, 0.94, 1],
      }),
    [introPartyProgress]
  );
  const introPartyTranslateY = useMemo(
    () =>
      introPartyProgress.interpolate({
        inputRange: [0, 0.52, 0.78, 1],
        outputRange: [78, -18, 6, 0],
      }),
    [introPartyProgress]
  );
  const introGamesOpacity = useMemo(
    () =>
      introGamesProgress.interpolate({
        inputRange: [0, 0.12, 1],
        outputRange: [0, 1, 1],
      }),
    [introGamesProgress]
  );
  const introGamesScale = useMemo(
    () =>
      introGamesProgress.interpolate({
        inputRange: [0, 0.52, 0.78, 1],
        outputRange: [0.2, 1.24, 0.94, 1],
      }),
    [introGamesProgress]
  );
  const introGamesTranslateY = useMemo(
    () =>
      introGamesProgress.interpolate({
        inputRange: [0, 0.52, 0.78, 1],
        outputRange: [180, -22, 8, 0],
      }),
    [introGamesProgress]
  );

  return {
    backdropAnimatedStyle: {
      opacity: introBackdropOpacity,
    },
    gamesTitleAnimatedStyle: {
      opacity: introGamesOpacity,
      transform: [
        { translateY: introGamesTranslateY },
        { scale: introGamesScale },
      ],
    },
    handleIntroLayout,
    logoAnimatedStyle: {
      transform: [{ translateY: introTranslateY }, { scale: introScale }],
    },
    partyTitleAnimatedStyle: {
      opacity: introPartyOpacity,
      transform: [
        { translateY: introPartyTranslateY },
        { scale: introPartyScale },
      ],
    },
    shouldRenderIntro,
  };
}
