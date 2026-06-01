import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CONTACT_EMAIL, LEGAL_DOCS } from '@/content/legal';
import { useTheme } from '@/hooks/use-theme';

export default function LegalScreen() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Legal & Safety</ThemedText>
        {LEGAL_DOCS.map((doc) => (
          <View key={doc.id} style={styles.doc}>
            <ThemedText type="smallBold" style={styles.docTitle}>{doc.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Updated {doc.updated}</ThemedText>
            {doc.sections.map((s) => (
              <View key={s.heading} style={styles.section}>
                <ThemedText type="smallBold">{s.heading}</ThemedText>
                <ThemedText type="small">{s.body}</ThemedText>
              </View>
            ))}
          </View>
        ))}
        <ThemedText type="small" themeColor="textSecondary" style={styles.contact}>
          Contact: {CONTACT_EMAIL}
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.two },
  doc: { marginTop: Spacing.three, gap: Spacing.one },
  docTitle: { marginBottom: Spacing.half },
  section: { marginTop: Spacing.two, gap: Spacing.half },
  contact: { marginTop: Spacing.four },
});
