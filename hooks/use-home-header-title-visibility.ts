import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const homeHeaderTitleScrollY = 190;

export function useHomeHeaderTitleVisibility() {
  const [isHeaderTitleVisible, setIsHeaderTitleVisible] = useState(false);
  const isHeaderTitleVisibleRef = useRef(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const shouldShowTitle =
        event.nativeEvent.contentOffset.y >= homeHeaderTitleScrollY;

      if (shouldShowTitle === isHeaderTitleVisibleRef.current) {
        return;
      }

      isHeaderTitleVisibleRef.current = shouldShowTitle;
      setIsHeaderTitleVisible(shouldShowTitle);
    },
    []
  );

  return {
    handleScroll,
    isHeaderTitleVisible,
  };
}
