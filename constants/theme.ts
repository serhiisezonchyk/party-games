/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#8B5CF6";
const tintColorDark = "#A855F7";

export const Colors = {
  light: {
    text: "#071025",
    mutedText: "#5E667A",
    background: "#FFFFFF",
    surface: "#F7F4FF",
    card: "#FFFFFF",
    border: "#E6E9F0",
    tint: tintColorLight,
    onTint: "#FFFFFF",
    icon: "#6B7280",
    tabIconDefault: "#6B7280",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#FFFFFF",
    mutedText: "#D6D9E6",
    background: "#020714",
    surface: "rgba(255, 255, 255, 0.08)",
    card: "#0F172A",
    border: "#24304A",
    tint: tintColorDark,
    onTint: "#FFFFFF",
    icon: "#C7CBD8",
    tabIconDefault: "#C7CBD8",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
