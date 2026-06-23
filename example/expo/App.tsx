import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Toaster, fulltoast } from "fulltoast";

export default function App() {
  return (
    <Toaster
      position="top-center"
      theme="light"
      offset={{ top: 58, left: 16, right: 16, bottom: 34 }}
      options={{
        roundness: 20,
      }}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.kicker}>FullToast Preview</Text>
          <Text style={styles.title}>Mobile toast notifications inspired by Sileo.</Text>
          <Text style={styles.subtitle}>
            Tap each control, tap a toast to expand it, or swipe it away.
          </Text>
        </View>

        <View style={styles.grid}>
          <Pressable
            style={styles.button}
            onPress={() =>
              fulltoast.success({
                title: "Saved",
                description: "Your changes are synced and ready on this device.",
                button: {
                  title: "View",
                  onPress: () => fulltoast.info({ title: "Opening details" }),
                },
              })
            }
          >
            <Text style={styles.buttonText}>Show success</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.errorButton]}
            onPress={() =>
              fulltoast.error({
                title: "Upload failed",
                description: "The connection dropped before the file finished.",
                button: {
                  title: "Retry",
                  onPress: () =>
                    fulltoast.info({
                      title: "Retry started",
                      description: "A new upload attempt is running.",
                    }),
                },
              })
            }
          >
            <Text style={styles.buttonText}>Show error</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.warningButton]}
            onPress={() =>
              fulltoast.warning({
                title: "Storage almost full",
                description: "Free up some space before recording more media.",
                position: "bottom-center",
              })
            }
          >
            <Text style={styles.darkButtonText}>Bottom warning</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.infoButton]}
            onPress={() =>
              fulltoast.action({
                title: "New invite",
                description: "Ana wants to collaborate on the project.",
                position: "top-right",
                button: {
                  title: "Review",
                  onPress: () => fulltoast.success({ title: "Opening invite" }),
                },
              })
            }
          >
            <Text style={styles.buttonText}>Action toast</Text>
          </Pressable>

          <Pressable
            style={styles.button}
            onPress={() =>
              fulltoast.promise(wait(), {
                loading: { title: "Working", description: "Doing the thing..." },
                success: { title: "Done", description: "The promise resolved." },
                error: { title: "Failed" },
              })
            }
          >
            <Text style={styles.buttonText}>Show promise</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.loadingButton]}
            onPress={() =>
              fulltoast.show({
                title: "Syncing",
                type: "loading",
                duration: 2800,
                description: "Keeping the loader alive for a moment.",
              })
            }
          >
            <Text style={styles.buttonText}>Show loading</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.clearButton]}
            onPress={() => fulltoast.clear()}
          >
            <Text style={styles.darkButtonText}>Clear all</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Toaster>
  );
}

function wait() {
  return new Promise((resolve) => setTimeout(resolve, 1400));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f5f5f4",
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 74,
    paddingBottom: 28,
  },
  kicker: {
    color: "#0f766e",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: "#18181b",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 10,
  },
  subtitle: {
    color: "#57534e",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    marginTop: 12,
  },
  grid: {
    gap: 12,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#18181b",
    paddingHorizontal: 18,
  },
  errorButton: {
    backgroundColor: "#b91c1c",
  },
  warningButton: {
    backgroundColor: "#fbbf24",
  },
  infoButton: {
    backgroundColor: "#2563eb",
  },
  loadingButton: {
    backgroundColor: "#52525b",
  },
  clearButton: {
    backgroundColor: "#e7e5e4",
  },
  buttonText: {
    color: "#fafafa",
    fontWeight: "800",
  },
  darkButtonText: {
    color: "#18181b",
    fontWeight: "800",
  },
});
