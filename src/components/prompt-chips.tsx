import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const SUGGESTED_PROMPTS = [
  'Neck tension',
  'Lower back tightness',
  'Calf cramp',
  'Shoulder soreness',
  'Stretch with weights',
  'Post-workout recovery',
];

export function PromptChips({ onSelect }: { onSelect: (text: string) => void }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {SUGGESTED_PROMPTS.map((p) => (
        <Pressable key={p} onPress={() => onSelect(p)} style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small">{p}</ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
