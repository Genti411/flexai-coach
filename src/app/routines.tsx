import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StretchCard } from '@/components/stretch-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { deleteRoutine, getRoutines, removeItem, Routine } from '@/lib/routines';
import { useTheme } from '@/hooks/use-theme';

export default function RoutinesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getRoutines().then(setRoutines);
  }, []);

  useEffect(refresh, [refresh]);

  const open = routines.find((r) => r.id === openId) ?? null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Routines</ThemedText>

        {routines.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            No routines yet. Tap "Save to routine" on a stretch to start one.
          </ThemedText>
        )}

        {!open &&
          routines.map((r) => (
            <View key={r.id} style={styles.routineRow}>
              <Pressable onPress={() => setOpenId(r.id)} style={[styles.routineBtn, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">{r.name} ({r.items.length})</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => deleteRoutine(r.id).then(setRoutines)}
                style={[styles.del, { backgroundColor: theme.backgroundElement }]}
              >
                <ThemedText type="small" themeColor="danger">Delete</ThemedText>
              </Pressable>
            </View>
          ))}

        {open && (
          <View>
            <Pressable onPress={() => setOpenId(null)} style={styles.back}>
              <ThemedText type="link">{'‹'} All routines</ThemedText>
            </Pressable>
            <ThemedText type="smallBold">{open.name}</ThemedText>
            {open.items.map((rec, i) => (
              <View key={`${rec.name}-${i}`}>
                <StretchCard rec={rec} />
                <Pressable
                  onPress={() => removeItem(open.id, i).then(setRoutines)}
                  style={[styles.del, { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement }]}
                >
                  <ThemedText type="small" themeColor="danger">Remove</ThemedText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.two },
  routineRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  routineBtn: { flex: 1, padding: Spacing.three, borderRadius: 12 },
  del: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, marginTop: Spacing.one },
});
