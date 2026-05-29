import { StyleSheet, View } from 'react-native';

import { StretchCard } from '@/components/stretch-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { StretchResponse } from '@/core/types';

export type ChatMessage =
  | { id: string; role: 'user' | 'assistant'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'response'; response: StretchResponse };

export function MessageBubble({
  message,
  onEasier,
  onHarder,
}: {
  message: ChatMessage;
  onEasier: (bodyArea: string) => void;
  onHarder: (bodyArea: string) => void;
}) {
  if (message.kind === 'text') {
    const isUser = message.role === 'user';
    return (
      <ThemedView type={isUser ? 'bubbleUser' : 'bubbleAssistant'} style={[styles.textBubble, isUser ? styles.right : styles.left]}>
        <ThemedText type="small" themeColor={isUser ? 'accentText' : 'text'}>{message.text}</ThemedText>
      </ThemedView>
    );
  }
  const res = message.response;
  return (
    <View style={[styles.left, styles.responseWrap]}>
      <ThemedText type="small">{res.summary}</ThemedText>
      {res.recommendations.map((rec, i) => (
        <StretchCard key={`${rec.name}-${i}`} rec={rec} onEasier={() => onEasier(res.body_area)} onHarder={() => onHarder(res.body_area)} />
      ))}
      {res.seek_medical_help_if.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.seek}>
          Seek medical help if: {res.seek_medical_help_if.join('; ')}.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  textBubble: { maxWidth: '85%', borderRadius: 16, padding: Spacing.three, marginVertical: Spacing.one },
  responseWrap: { maxWidth: '95%', marginVertical: Spacing.one },
  right: { alignSelf: 'flex-end' },
  left: { alignSelf: 'flex-start' },
  seek: { marginTop: Spacing.two },
});
