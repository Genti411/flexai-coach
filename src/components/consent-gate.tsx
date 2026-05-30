import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { MEDICAL_DISCLAIMER, PRIVACY_POLICY } from '@/content/legal';
import { useTheme } from '@/hooks/use-theme';

export function ConsentGate({ onAccept }: { onAccept: () => void }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Welcome to FlexAI Coach</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Before you start, please read and accept the following. FlexAI Coach is not medical advice.
        </ThemedText>

        <ThemedText type="smallBold" style={styles.h}>{MEDICAL_DISCLAIMER.title}</ThemedText>
        {MEDICAL_DISCLAIMER.sections.map((s) => (
          <ThemedText key={s.heading} type="small" style={styles.p}>
            {s.heading}: {s.body}
          </ThemedText>
        ))}

        <ThemedText type="smallBold" style={styles.h}>{PRIVACY_POLICY.title}</ThemedText>
        <ThemedText type="small" style={styles.p}>{PRIVACY_POLICY.sections[0].body}</ThemedText>
        <ThemedText type="small" style={styles.p}>{PRIVACY_POLICY.sections[1].body}</ThemedText>
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={onAccept}
        style={[styles.btn, { backgroundColor: theme.accent }]}
      >
        <ThemedText type="small" themeColor="accentText">I understand and agree</ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two },
  h: { marginTop: Spacing.three },
  p: { marginTop: Spacing.one },
  btn: { margin: Spacing.three, padding: Spacing.three, borderRadius: 999, alignItems: 'center' },
});
