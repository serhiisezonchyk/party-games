export type TelegramColorScheme = "light" | "dark";
export type TelegramEventName = "themeChanged" | "viewportChanged";

export interface TelegramThemeParams {
  accent_text_color?: string;
  bg_color?: string;
  button_color?: string;
  button_text_color?: string;
  destructive_text_color?: string;
  header_bg_color?: string;
  hint_color?: string;
  link_color?: string;
  secondary_bg_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  text_color?: string;
}

export interface TelegramWebAppUser {
  first_name: string;
  id: number;
  is_bot?: boolean;
  is_premium?: boolean;
  language_code?: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

export interface TelegramWebAppInitData {
  auth_date?: number;
  chat_type?: string;
  query_id?: string;
  start_param?: string;
  user?: TelegramWebAppUser;
}

export interface TelegramWebApp {
  colorScheme: TelegramColorScheme;
  disableVerticalSwipes?: () => void;
  expand: () => void;
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  isVersionAtLeast: (version: string) => boolean;
  offEvent: (eventType: TelegramEventName, eventHandler: () => void) => void;
  onEvent: (eventType: TelegramEventName, eventHandler: () => void) => void;
  platform: string;
  ready: () => void;
  requestFullscreen?: () => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  setHeaderColor?: (color: string) => void;
  themeParams: TelegramThemeParams;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
