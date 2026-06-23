# FullToast

FullToast is a React Native and Expo toast library inspired by Sileo's clean, animated, pill-like notifications.

It is designed for Expo Go first: no native modules, no required SVG package, and a small imperative API that works well in app code, mutations, forms, and async flows.

## Installation

```bash
pnpm add fulltoast
```

```bash
bun add fulltoast
```

FullToast expects `react` and `react-native` from your app.

## Usage

Mount one `Toaster` near the root of your app.

```tsx
import { Toaster, fulltoast } from "fulltoast";

export default function App() {
  return (
    <Toaster position="top-right" theme="light">
      <YourApp />
    </Toaster>
  );
}
```

Call it from anywhere after the toaster is mounted.

```tsx
fulltoast.success({
  title: "Saved",
  description: "Your changes are already on the device.",
});

fulltoast.error({
  title: "Upload failed",
  description: "Check the connection and try again.",
  button: {
    title: "Retry",
    onPress: retryUpload,
  },
});
```

## Promise Toasts

```tsx
await fulltoast.promise(saveProfile(), {
  loading: { title: "Saving", description: "Updating your profile..." },
  success: { title: "Profile saved" },
  error: { title: "Could not save", description: "Please try again." },
});
```

## API

```tsx
fulltoast.show(options);
fulltoast.success(options);
fulltoast.error(options);
fulltoast.warning(options);
fulltoast.info(options);
fulltoast.action(options);
fulltoast.promise(promise, options);
fulltoast.dismiss(id);
fulltoast.clear(position?);
```

## Options

```tsx
type FullToastOptions = {
  id?: string;
  title?: string;
  description?: React.ReactNode | string;
  type?: "success" | "loading" | "error" | "warning" | "info" | "action";
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  duration?: number | null;
  icon?: React.ReactNode | null;
  fill?: string;
  textColor?: string;
  roundness?: number;
  autopilot?: boolean | { expand?: number; collapse?: number };
  button?: { title: string; onPress: () => void };
  onPress?: () => void;
  onDismiss?: () => void;
};
```

## Styling

Use React Native style objects instead of CSS class names.

```tsx
<Toaster
  options={{
    fill: "#111827",
    roundness: 20,
    styles: {
      title: { fontSize: 15 },
      description: { color: "#d1d5db" },
    },
  }}
/>
```

## Expo Safe Areas

FullToast does not require `react-native-safe-area-context`, so it works in Expo Go without extra native setup. If your app already uses safe-area insets, pass them through `offset`.

```tsx
const insets = useSafeAreaInsets();

<Toaster
  position="top-center"
  offset={{ top: insets.top + 12, left: 16, right: 16 }}
/>
```

## Gestures

Tap a toast with a description to expand or collapse it. Swipe upward from top positions or downward from bottom positions to dismiss.

## Credits

Powered by [Brayan-chan](https://github.com/brayan-chan)