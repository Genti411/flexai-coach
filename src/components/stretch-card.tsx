import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SaveToRoutine } from '@/components/save-to-routine';
import { StretchAnimation } from '@/animation/stretch-animation';
import { getTrack } from '@/animation/tracks';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addToRoutine } from '@/lib/routines';
import { imageForStretch } from '@/lib/stretch-images';
import { Recommendation } from '@/core/types';

export function StretchCard({ rec, onEasier, onHarder }: { rec: Recommendation; onEasier?: () => void; onHarder?: () => void }) {
  const theme = useTheme();
  const interactive = !!onEasier && !!onHarder;
  const hasAnimation = getTrack(rec.animationId) !== null;
  const [showAnimation, setShowAnimation] = useState(false);
  const image = imageForStretch(rec.name);
  const [showSave, setShowSave] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const save = (name: string) => {
    void addToRoutine(name, rec).then(() => {
      setSavedTo(name.trim());
      setShowSave(false);
    });
  };

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

      {image && !showAnimation && (
        <Image source={image} style={styles.image} contentFit="contain" />
      )}
      {showAnimation && hasAnimation && (
        <View style={styles.animation}><StretchAnimation animationId={rec.animationId} /></View>
      )}

      <View style={styles.actions}>
        {hasAnimation && (
          <Pressable onPress={() => setShowAnimation((v) => !v)} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small">{showAnimation ? 'Hide animation' : 'Show animation'}</ThemedText>
          </Pressable>
        )}
        {interactive && (
          <>
            <Pressable onPress={onEasier} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Make easier</ThemedText>
            </Pressable>
            <Pressable onPress={onHarder} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Make harder</ThemedText>
            </Pressable>
            <Pressable onPress={() => { setShowSave((v) => !v); setSavedTo(null); }} style={[styles.btn, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Save to routine</ThemedText>
            </Pressable>
          </>
        )}
      </View>

      {showSave && <SaveToRoutine onSave={save} />}
      {savedTo && <ThemedText type="small" themeColor="accent">Saved to {savedTo}.</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.one, marginTop: Spacing.two },
  step: { marginTop: Spacing.half },
  meta: { marginTop: Spacing.one },
  animation: { alignItems: 'center', marginTop: Spacing.two },
  image: { width: '100%', height: 180, marginTop: Spacing.two, borderRadius: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
});
