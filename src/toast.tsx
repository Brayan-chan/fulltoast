import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type ViewStyle,
} from "react-native";
import {
  AUTO_COLLAPSE_DELAY,
  AUTO_EXPAND_DELAY,
  DEFAULT_ROUNDNESS,
  DEFAULT_TOAST_DURATION,
  EXIT_DURATION,
  MOTION,
  TOAST_GAP,
  TOAST_MIN_HEIGHT,
  TOAST_WIDTH,
} from "./constants";
import { StateIcon } from "./icons";
import { interpolate, useSpringNumber } from "./motion";
import type {
  FullToastOffsetConfig,
  FullToastOffsetValue,
  FullToastOptions,
  FullToastPosition,
  FullToastPromiseOptions,
  FullToastState,
  FullToasterProps,
} from "./types";

interface InternalToastOptions extends FullToastOptions {
  state?: FullToastState;
}

interface ToastItem extends InternalToastOptions {
  id: string;
  instanceId: string;
  exiting?: boolean;
  autoExpandDelayMs?: number;
  autoCollapseDelayMs?: number;
}

type Listener = (toasts: ToastItem[]) => void;

const STATE_COLORS: Record<FullToastState, string> = {
  success: "#16a34a",
  loading: "#71717a",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#0ea5e9",
  action: "#6366f1",
};

const THEME = {
  light: {
    fill: "#18181b",
    text: "#fafafa",
    description: "#d4d4d8",
    shadow: "#000000",
  },
  dark: {
    fill: "#fafafa",
    text: "#18181b",
    description: "#52525b",
    shadow: "#000000",
  },
} as const;

const store = {
  toasts: [] as ToastItem[],
  listeners: new Set<Listener>(),
  position: "top-right" as FullToastPosition,
  options: undefined as Partial<FullToastOptions> | undefined,

  emit() {
    for (const listener of this.listeners) listener(this.toasts);
  },

  update(fn: (prev: ToastItem[]) => ToastItem[]) {
    this.toasts = fn(this.toasts);
    this.emit();
  },
};

let idCounter = 0;
const generateId = () =>
  `${++idCounter}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const timeoutKey = (toast: ToastItem) => `${toast.id}:${toast.instanceId}`;

const isTop = (position: FullToastPosition) => position.startsWith("top");
const isCenter = (position: FullToastPosition) => position.endsWith("center");
const isRight = (position: FullToastPosition) => position.endsWith("right");

const resolveAutopilot = (
  opts: InternalToastOptions,
  duration: number | null,
) => {
  if (opts.autopilot === false || !duration || duration <= 0) return {};
  const cfg = typeof opts.autopilot === "object" ? opts.autopilot : undefined;
  const clamp = (value: number) => Math.min(duration, Math.max(0, value));
  return {
    autoExpandDelayMs: clamp(cfg?.expand ?? AUTO_EXPAND_DELAY),
    autoCollapseDelayMs: clamp(cfg?.collapse ?? AUTO_COLLAPSE_DELAY),
  };
};

const mergeOptions = (options: InternalToastOptions): InternalToastOptions => ({
  ...store.options,
  ...options,
  styles: {
    ...store.options?.styles,
    ...options.styles,
  },
});

const buildToastItem = (
  merged: InternalToastOptions,
  id: string,
  fallbackPosition?: FullToastPosition,
): ToastItem => {
  const duration = merged.duration ?? DEFAULT_TOAST_DURATION;
  return {
    ...merged,
    ...resolveAutopilot(merged, duration),
    id,
    instanceId: generateId(),
    position: merged.position ?? fallbackPosition ?? store.position,
  };
};

const dismissToast = (id: string) => {
  const item = store.toasts.find((toast) => toast.id === id);
  if (!item || item.exiting) return;

  item.onDismiss?.();
  store.update((prev) =>
    prev.map((toast) =>
      toast.id === id ? { ...toast, exiting: true } : toast,
    ),
  );

  setTimeout(() => {
    store.update((prev) => prev.filter((toast) => toast.id !== id));
  }, EXIT_DURATION);
};

const createToast = (options: InternalToastOptions) => {
  const live = store.toasts.filter((toast) => !toast.exiting);
  const merged = mergeOptions(options);
  const id = merged.id ?? "fulltoast-default";
  const previous = live.find((toast) => toast.id === id);
  const item = buildToastItem(merged, id, previous?.position);

  if (previous) {
    store.update((prev) => prev.map((toast) => (toast.id === id ? item : toast)));
  } else {
    store.update((prev) => [...prev.filter((toast) => toast.id !== id), item]);
  }

  return { id, duration: merged.duration ?? DEFAULT_TOAST_DURATION };
};

const updateToast = (id: string, options: InternalToastOptions) => {
  const existing = store.toasts.find((toast) => toast.id === id);
  if (!existing) return;

  const item = buildToastItem(mergeOptions(options), id, existing.position);
  store.update((prev) => prev.map((toast) => (toast.id === id ? item : toast)));
};

export const fulltoast = {
  show: (opts: FullToastOptions) => createToast({ ...opts, state: opts.type }).id,
  success: (opts: FullToastOptions) =>
    createToast({ ...opts, state: "success" }).id,
  error: (opts: FullToastOptions) =>
    createToast({ ...opts, state: "error" }).id,
  warning: (opts: FullToastOptions) =>
    createToast({ ...opts, state: "warning" }).id,
  info: (opts: FullToastOptions) => createToast({ ...opts, state: "info" }).id,
  action: (opts: FullToastOptions) =>
    createToast({ ...opts, state: "action" }).id,

  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    opts: FullToastPromiseOptions<T>,
  ): Promise<T> => {
    const { id } = createToast({
      ...opts.loading,
      state: "loading",
      duration: null,
      position: opts.position,
    });

    const pending = typeof promise === "function" ? promise() : promise;

    pending
      .then((data) => {
        const next = opts.action
          ? typeof opts.action === "function"
            ? opts.action(data)
            : opts.action
          : typeof opts.success === "function"
            ? opts.success(data)
            : opts.success;
        updateToast(id, {
          ...next,
          id,
          state: opts.action ? "action" : "success",
        });
      })
      .catch((err) => {
        const next =
          typeof opts.error === "function" ? opts.error(err) : opts.error;
        updateToast(id, { ...next, id, state: "error" });
      });

    return pending;
  },

  dismiss: dismissToast,

  clear: (position?: FullToastPosition) => {
    store.update((prev) =>
      position ? prev.filter((toast) => toast.position !== position) : [],
    );
  },
};

export function Toaster({
  children,
  position = "top-right",
  offset,
  options,
  theme = "light",
  maxVisible,
}: FullToasterProps) {
  const scheme = useColorScheme();
  const resolvedTheme = theme ?? (scheme === "dark" ? "dark" : "light");
  const [toasts, setToasts] = useState(store.toasts);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const latestOptionsRef = useRef(options);

  useEffect(() => {
    latestOptionsRef.current = options;
    store.position = position;
    store.options = options;
  }, [options, position]);

  useEffect(() => {
    const listener: Listener = (next) => setToasts(next);
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const keys = new Set(toasts.map(timeoutKey));
    for (const [key, timer] of timersRef.current) {
      if (!keys.has(key)) {
        clearTimeout(timer);
        timersRef.current.delete(key);
      }
    }

    for (const item of toasts) {
      if (item.exiting || item.duration === null) continue;
      const key = timeoutKey(item);
      if (timersRef.current.has(key)) continue;
      const duration = item.duration ?? DEFAULT_TOAST_DURATION;
      if (duration <= 0) continue;

      timersRef.current.set(
        key,
        setTimeout(() => dismissToast(item.id), duration),
      );
    }
  }, [toasts]);

  const grouped = useMemo(() => {
    const map = new Map<FullToastPosition, ToastItem[]>();
    for (const toast of toasts) {
      const pos = toast.position ?? position;
      const items = map.get(pos) ?? [];
      items.push(toast);
      map.set(pos, items);
    }
    return Array.from(map, ([pos, items]) => [
      pos,
      maxVisible ? items.slice(-maxVisible) : items,
    ]) as Array<[FullToastPosition, ToastItem[]]>;
  }, [maxVisible, position, toasts]);

  return (
    <>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {grouped.map(([pos, items]) => (
          <ToastStack
            key={pos}
            items={items}
            offset={offset}
            position={pos}
            theme={resolvedTheme}
          />
        ))}
      </View>
    </>
  );
}

function ToastStack({
  items,
  offset,
  position,
  theme,
}: {
  items: ToastItem[];
  offset?: FullToastOffsetValue | FullToastOffsetConfig;
  position: FullToastPosition;
  theme: "light" | "dark";
}) {
  const viewport = Dimensions.get("window");
  const horizontalInset = 16;
  const width = Math.min(TOAST_WIDTH, viewport.width - horizontalInset * 2);
  const resolvedOffset =
    typeof offset === "number"
      ? { top: offset, right: offset, bottom: offset, left: offset }
      : offset;

  const stackStyle = useMemo(() => {
    const style: ViewStyle = {
      position: "absolute",
      width,
      gap: TOAST_GAP,
    };

    if (isTop(position)) {
      style.top = resolvedOffset?.top ?? 54;
      style.flexDirection = "column";
    } else {
      style.bottom = resolvedOffset?.bottom ?? 38;
      style.flexDirection = "column-reverse";
    }

    if (isCenter(position)) {
      style.left = (viewport.width - width) / 2;
    } else if (isRight(position)) {
      style.right = resolvedOffset?.right ?? horizontalInset;
    } else {
      style.left = resolvedOffset?.left ?? horizontalInset;
    }

    return style;
  }, [position, resolvedOffset, viewport.width, width]);

  return (
    <View pointerEvents="box-none" style={stackStyle}>
      {items.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          theme={theme}
          width={width}
          edge={isTop(position) ? "top" : "bottom"}
        />
      ))}
    </View>
  );
}

const ToastCard = memo(function ToastCard({
  edge,
  item,
  theme,
  width,
}: {
  edge: "top" | "bottom";
  item: ToastItem;
  theme: "light" | "dark";
  width: number;
}) {
  const palette = THEME[theme];
  const state = item.state ?? item.type ?? "success";
  const tone = STATE_COLORS[state];
  const hasDetails = Boolean(item.description) || Boolean(item.button);
  const title = item.title ?? state;
  const fill = item.fill ?? palette.fill;
  const textColor = item.textColor ?? palette.text;
  const roundness = Math.max(0, item.roundness ?? DEFAULT_ROUNDNESS);

  const [bodyHeight, setBodyHeight] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [dragTarget, setDragTarget] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const dragTargetRef = useRef(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setHeaderVisible(false);
    const frame = requestAnimationFrame(() => setHeaderVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [item.instanceId]);

  useEffect(() => {
    if (!hasDetails || item.exiting || state === "loading") {
      setExpanded(false);
      return;
    }

    if (item.autoExpandDelayMs == null && item.autoCollapseDelayMs == null) {
      return;
    }

    const expandTimer = setTimeout(() => {
      setExpanded(true);
    }, item.autoExpandDelayMs ?? 0);

    const collapseDelay = item.autoCollapseDelayMs;
    const collapseTimer =
      collapseDelay == null
        ? undefined
        : setTimeout(() => {
            setExpanded(false);
          }, collapseDelay);

    return () => {
      clearTimeout(expandTimer);
      if (collapseTimer) clearTimeout(collapseTimer);
    };
  }, [
    hasDetails,
    item.autoCollapseDelayMs,
    item.autoExpandDelayMs,
    item.exiting,
    item.instanceId,
    state,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          const direction = edge === "top" ? -1 : 1;
          const value =
            Math.sign(gesture.dy) === direction
              ? Math.max(-70, Math.min(70, gesture.dy))
              : gesture.dy * 0.16;
          if (Math.abs(value - dragTargetRef.current) > 0.5) {
            dragTargetRef.current = value;
            setDragTarget(value);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldDismiss =
            edge === "top" ? gesture.dy < -42 : gesture.dy > 42;
          if (shouldDismiss) {
            dismissToast(item.id);
            return;
          }
          dragTargetRef.current = 0;
          setDragTarget(0);
        },
        onPanResponderTerminate: () => {
          dragTargetRef.current = 0;
          setDragTarget(0);
        },
      }),
    [edge, item.id],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      item.onPress?.();
      if (hasDetails && state !== "loading") {
        setExpanded((value) => !value);
      }
      event.stopPropagation();
    },
    [hasDetails, item, state],
  );

  const handleBodyLayout = useCallback((event: LayoutChangeEvent) => {
    setBodyHeight(event.nativeEvent.layout.height);
  }, []);

  const open = expanded && hasDetails && state !== "loading";
  const entry = useSpringNumber(
    ready && !item.exiting ? 1 : 0,
    item.exiting ? MOTION.exit : MOTION.entry,
    0,
  );
  const expandProgress = useSpringNumber(open ? 1 : 0, MOTION.expand, 0);
  const drag = useSpringNumber(dragTarget, MOTION.drag, 0);
  const headerMotion = useSpringNumber(
    headerVisible ? 1 : 0,
    MOTION.swap,
    1,
  );
  const expandedHeight = TOAST_MIN_HEIGHT + Math.max(bodyHeight, 56);
  const baseHeight = interpolate(expandProgress, [0, 1], [
    TOAST_MIN_HEIGHT,
    expandedHeight,
  ]);
  const height = item.exiting
    ? interpolate(entry, [0, 1], [0, baseHeight])
    : baseHeight;
  const entryOffset = interpolate(entry, [0, 1], [
    edge === "top" ? -18 : 18,
    0,
  ]);
  const translateY = drag + entryOffset;
  const scale = interpolate(entry, [0, 1], [0.94, 1]);
  const bodyOpacity = interpolate(expandProgress, [0, 1], [0, 1]);
  const bodyTranslate = interpolate(expandProgress, [0, 1], [
    edge === "top" ? -4 : 4,
    0,
  ]);
  const headerOpacity = interpolate(headerMotion, [0, 1], [0, 1]);
  const headerTranslate = interpolate(headerMotion, [0, 1], [
    edge === "top" ? -7 : 7,
    0,
  ]);
  const badgeScale = interpolate(headerMotion, [0, 1], [0.72, 1]);
  const shadowOpacity = Platform.OS === "ios" ? 0.18 * entry : 0;
  const elevation = entry > 0.08 ? Math.round(8 * entry) : 0;
  const showBody = hasDetails && state !== "loading" && (open || expandProgress > 0.03);

  return (
    <View
      pointerEvents="box-none"
      style={{
        opacity: entry,
        transform: [{ translateY }, { scale }],
      }}
      {...panResponder.panHandlers}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            width,
            minHeight: item.exiting ? 0 : TOAST_MIN_HEIGHT,
            height,
            borderRadius: roundness,
            backgroundColor: fill,
            opacity: pressed ? 0.94 : 1,
            shadowColor: palette.shadow,
            shadowOpacity,
            elevation,
          },
          item.styles?.container,
        ]}
      >
        <View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            },
            item.styles?.header,
          ]}
        >
          <View
            style={[
              styles.badge,
              { backgroundColor: `${tone}24` },
              { transform: [{ scale: badgeScale }] },
              item.styles?.badge,
            ]}
          >
            {item.icon === null ? null : item.icon ?? (
              <StateIcon color={tone} state={state} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: textColor }, item.styles?.title]}
          >
            {title}
          </Text>
        </View>

        {showBody && (
          <View
            pointerEvents={open ? "auto" : "none"}
            style={[
              styles.body,
              {
                opacity: bodyOpacity,
                transform: [{ translateY: bodyTranslate }],
              },
            ]}
          >
            <View onLayout={handleBodyLayout} style={styles.bodyMeasure}>
              {typeof item.description === "string" ? (
                <Text
                  style={[
                    styles.description,
                    { color: palette.description },
                    item.styles?.description,
                  ]}
                >
                  {item.description}
                </Text>
              ) : (
                item.description
              )}

              {item.button && (
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    item.button?.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.button,
                    { borderColor: `${tone}66`, opacity: pressed ? 0.76 : 1 },
                    item.styles?.button,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: tone },
                      item.styles?.buttonText,
                    ]}
                  >
                    {item.button.title}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    shadowOpacity: Platform.OS === "ios" ? 0.18 : 0,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  header: {
    minHeight: TOAST_MIN_HEIGHT,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  body: {
    position: "absolute",
    top: TOAST_MIN_HEIGHT,
    left: 0,
    right: 0,
  },
  bodyMeasure: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  button: {
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  buttonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800",
  },
});
