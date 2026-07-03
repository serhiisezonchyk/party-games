import type { PropsWithChildren } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useKeyboardVisibility } from "@/hooks/use-keyboard-visibility";

interface SetupFooterProps {
  style: StyleProp<ViewStyle>;
}

export function SetupFooter({
  children,
  style,
}: PropsWithChildren<SetupFooterProps>) {
  const isKeyboardVisible = useKeyboardVisibility();

  if (isKeyboardVisible) {
    return null;
  }

  return <View style={style}>{children}</View>;
}
