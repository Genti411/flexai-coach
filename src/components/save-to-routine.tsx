import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getRoutines } from '@/lib/routines';

export function SaveToRoutine({ onSave }: { onSave: (name: string) => void }) {
  const theme = useTheme();
  const [names, setNames] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let active = true;
    getRoutines().then((rs) => active && setNames(rs.map((r) => r.name)));
    return () => {
      active = false;
    };
  }, []);

  const create = () => {
    if (draft.trim()) {
      onSave(draft);
      setDraft('');
    }
  };

  return (
    <View style={styles.wrap}>
      <ThemedText type="small" themeColor="textSecondary">Save to a routine:</ThemedText>
      {names.length > 0 && (
        <View style={styles.row}>
          {names.map((n) => (
            <Pressable key={n} onPress={() => onSave(n)} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">{n}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.row}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="New routine name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          onSubmitEditing={create}
          returnKeyType="done"
        />
        <Pressable onPress={create} style={[styles.chip, { backgroundColor: theme.accent }]}>
          <ThemedText type="small" themeColor="accentText">Create</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one, marginTop: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center' },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  input: { flex: 1, minWidth: 120, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
