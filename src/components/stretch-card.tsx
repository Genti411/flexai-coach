import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Recommendation } from '@/core/types';

export function StretchCard({ rec, onEasier, onHarder }: { rec: Recommendation; onEasier: () => void; onHarder: () => void }) {
  const theme = useTheme();
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{rec.name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {rec.target_muscles.join(', ')} · {rec.difficulty}{rec.weighted ? ' · weights' : ''}
      </ThemedText>
      {rec.instructions.map((line, i) => (
        <ThemedText key={i} type="small" style={styles.step}>{i + 1}. <ThemedText type="small">{line}</ThemedText></ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
        {rec.sets} sets · {rec.reps} reps · {rec.duration}
      </ThemedText>
      {rec.safety_notes.map((note, i) => (
        <ThemedText key={i} type="small" themeColor="warning">⚠ {note}</ThemedText>
      ))}
      <View style={styles.actions}>
        <Pressable accessibilityState={{ disabled: true }} style={[styles.btn, { backgroundColor: theme.backgroundSelected, opacity: 0.5 }]}>
          <ThemedText type="small">Show animation</ThemedText>
        </Pressable>
        <Pressable onPress={onEasier} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small">Make easier</ThemedText>
        </Pressable>
        <Pressable onPress={onHarder} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small">Make harder</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  step: { marginTop: Spacing.half },
  meta: { marginTop: Spacing.one },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
