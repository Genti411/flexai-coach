import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { clearHistory, getHistory, HistoryEntry } from '@/lib/history';
import { useTheme } from '@/hooks/use-theme';

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    getHistory().then(setEntries);
  }, []);

  const clear = () => {
    void clearHistory().then(() => setEntries([]));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">History</ThemedText>

        {entries.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No history yet. History is off by default; turn on "Save chat history" in Settings to record your queries on this device.
          </ThemedText>
        ) : (
          <>
            <Pressable onPress={clear} style={[styles.btn, { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="danger">Clear history</ThemedText>
            </Pressable>
            {entries.map((e, i) => (
              <View key={i} style={[styles.entry, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small">{e.query}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {e.bodyArea} · {e.count} suggestions · {e.ts.slice(0, 10)}
                </ThemedText>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  entry: { padding: Spacing.three, borderRadius: 12, gap: Spacing.half },
});
