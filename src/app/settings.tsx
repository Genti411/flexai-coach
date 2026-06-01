import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useConsent } from '@/lib/consent-context';
import { exportData, FitnessLevel, getProfile, setProfile } from '@/lib/store';
import { useTheme } from '@/hooks/use-theme';

const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { resetAll } = useConsent();
  const [level, setLevel] = useState<FitnessLevel | undefined>(undefined);
  const [goals, setGoals] = useState('');
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((p) => {
      setLevel(p.fitnessLevel);
      setGoals(p.goals ?? '');
    });
  }, []);

  const persist = (next: { fitnessLevel?: FitnessLevel; goals?: string }) => {
    const merged = { fitnessLevel: level, goals, ...next };
    setLevel(merged.fitnessLevel);
    setGoals(merged.goals ?? '');
    void setProfile(merged);
  };

  const onExport = async () => {
    const data = await exportData();
    setExported(JSON.stringify(data, null, 2));
  };

  const onDelete = () => {
    const doDelete = () => void resetAll();
    if (typeof Alert?.alert === 'function') {
      Alert.alert('Delete my data', 'This clears your consent and profile from this device. Continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    } else {
      doDelete();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Settings</ThemedText>

        <ThemedText type="smallBold" style={styles.h}>Fitness level</ThemedText>
        <View style={styles.row}>
          {LEVELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => persist({ fitnessLevel: l })}
              style={[styles.chip, { backgroundColor: level === l ? theme.accent : theme.backgroundElement }]}
            >
              <ThemedText type="small" themeColor={level === l ? 'accentText' : 'text'}>{l}</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="smallBold" style={styles.h}>Goals</ThemedText>
        <TextInput
          value={goals}
          onChangeText={setGoals}
          onBlur={() => persist({ goals })}
          placeholder="e.g. reduce neck tension"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />

        <ThemedText type="smallBold" style={styles.h}>Your data</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Chat is never stored. Only your consent record and the preferences above are saved on this device.
        </ThemedText>
        <View style={styles.row}>
          <Pressable onPress={() => void onExport()} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small">Export my data</ThemedText>
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="danger">Delete my data</ThemedText>
          </Pressable>
        </View>
        {exported != null && (
          <ThemedText type="code" selectable style={styles.exported}>{exported}</ThemedText>
        )}

        <ThemedText type="smallBold" style={styles.h}>Legal</ThemedText>
        <Pressable onPress={() => router.push('/legal')}>
          <ThemedText type="link">Disclaimer, Privacy, Terms & Copyright</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.one },
  h: { marginTop: Spacing.three },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.one },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  exported: { marginTop: Spacing.two },
});
