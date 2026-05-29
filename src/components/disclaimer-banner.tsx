import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { DISCLAIMER } from '@/core/types';

export function DisclaimerBanner() {
  const [open, setOpen] = useState(false);
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <Pressable onPress={() => setOpen((v) => !v)}>
        <ThemedText type="small" themeColor="textSecondary">
          {open ? DISCLAIMER : 'Not medical advice. Tap to read the full disclaimer.'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
