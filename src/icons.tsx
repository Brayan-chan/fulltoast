import { memo, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { FullToastState } from "./types";

interface IconProps {
  color: string;
  state: FullToastState;
}

const ICON_LABEL: Record<FullToastState, string> = {
  success: "check",
  loading: "loading",
  error: "error",
  warning: "warning",
  info: "info",
  action: "action",
};

const GLYPH: Record<Exclude<FullToastState, "loading">, string> = {
  success: "✓",
  error: "×",
  warning: "!",
  info: "i",
  action: "→",
};

export const StateIcon = memo(function StateIcon({ color, state }: IconProps) {
  const [rotation, setRotation] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (state !== "loading") return;

    const tick = (time: number) => {
      if (!startRef.current) startRef.current = time;
      setRotation(((time - startRef.current) / 900) * 360);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      startRef.current = 0;
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [state]);

  if (state === "loading") {
    return (
      <View
        accessibilityLabel={ICON_LABEL[state]}
        style={[
          styles.loader,
          {
            borderColor: `${color}44`,
            borderTopColor: color,
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      />
    );
  }

  return (
    <View accessibilityLabel={ICON_LABEL[state]} style={styles.glyphBox}>
      <Text style={[styles.glyph, { color }]}>{GLYPH[state]}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  loader: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
  } satisfies ViewStyle,
  glyphBox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  } satisfies ViewStyle,
  glyph: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
  } satisfies TextStyle,
});
