import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export type FullToastState =
  | "success"
  | "loading"
  | "error"
  | "warning"
  | "info"
  | "action";

export const FULLTOAST_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

export type FullToastPosition = (typeof FULLTOAST_POSITIONS)[number];

export interface FullToastStyles {
  container?: StyleProp<ViewStyle>;
  header?: StyleProp<ViewStyle>;
  badge?: StyleProp<ViewStyle>;
  title?: StyleProp<TextStyle>;
  description?: StyleProp<TextStyle>;
  button?: StyleProp<ViewStyle>;
  buttonText?: StyleProp<TextStyle>;
}

export interface FullToastButton {
  title: string;
  onPress: () => void;
}

export interface FullToastOptions {
  id?: string;
  title?: string;
  description?: ReactNode | string;
  type?: FullToastState;
  position?: FullToastPosition;
  duration?: number | null;
  icon?: ReactNode | null;
  styles?: FullToastStyles;
  fill?: string;
  textColor?: string;
  roundness?: number;
  autopilot?: boolean | { expand?: number; collapse?: number };
  button?: FullToastButton;
  onPress?: () => void;
  onDismiss?: () => void;
}

export type FullToastOffsetValue = number;

export type FullToastOffsetConfig = Partial<
  Record<"top" | "right" | "bottom" | "left", FullToastOffsetValue>
>;

export interface FullToasterProps {
  children?: ReactNode;
  position?: FullToastPosition;
  offset?: FullToastOffsetValue | FullToastOffsetConfig;
  options?: Partial<FullToastOptions>;
  theme?: "light" | "dark";
  maxVisible?: number;
}

export interface FullToastPromiseOptions<T = unknown> {
  loading: FullToastOptions;
  success: FullToastOptions | ((data: T) => FullToastOptions);
  error: FullToastOptions | ((err: unknown) => FullToastOptions);
  action?: FullToastOptions | ((data: T) => FullToastOptions);
  position?: FullToastPosition;
}
