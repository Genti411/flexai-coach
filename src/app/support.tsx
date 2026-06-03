import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { GEAR, PREMIUM_FEATURES } from '@/lib/gear';
import { useTheme } from '@/hooks/use-theme';

export default function SupportScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Gear & support</ThemedText>

        <ThemedText type="smallBold" style={styles.h}>Recommended gear</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Affiliate disclosure: some links may earn us a commission at no extra cost to you. These are general fitness accessories, not medical devices.
        </ThemedText>
        {GEAR.map((g) => (
          <View key={g.id} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.rowText}>
              <ThemedText type="smallBold">{g.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{g.blurb}</ThemedText>
            </View>
            <Pressable onPress={() => void Linking.openURL(g.url)} style={[styles.shop, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Shop</ThemedText>
            </Pressable>
          </View>
        ))}

        <ThemedText type="smallBold" style={styles.h}>Premium (coming soon)</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Planned paid features. Not available yet — the app is fully free today.
        </ThemedText>
        {PREMIUM_FEATURES.map((f) => (
          <ThemedText key={f} type="small">• {f}</ThemedText>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.one },
  h: { marginTop: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderRadius: 12, marginTop: Spacing.one },
  rowText: { flex: 1, gap: Spacing.half },
  shop: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
