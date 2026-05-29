import { useCallback, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/disclaimer-banner';
import { ChatMessage, MessageBubble } from '@/components/message-bubble';
import { PromptChips } from '@/components/prompt-chips';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getStretchResponse } from '@/core/engine';
import { Difficulty, DIFFICULTY_RANK } from '@/core/types';
import { useTheme } from '@/hooks/use-theme';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  kind: 'text',
  text:
    "Hi, I'm your AI mobility coach. Tell me where you feel tension, soreness, or cramps, " +
    'and I will suggest safe stretches, mobility drills, or light exercises that may help.',
};

let counter = 0;
const nextId = () => `m${counter++}`;

export default function Home() {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const lastInput = useRef<{ text: string; difficulty: Difficulty }>({ text: '', difficulty: 'beginner' });

  const send = useCallback(async (raw: string, difficulty: Difficulty = 'beginner') => {
    const text = raw.trim();
    if (!text) return;
    lastInput.current = { text, difficulty };
    const userMsg: ChatMessage = { id: nextId(), role: 'user', kind: 'text', text };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    const prompt = difficulty === 'beginner' ? text : `${difficulty} ${text}`;
    const response = await getStretchResponse(prompt);
    setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', kind: 'response', response }]);
  }, []);

  const adjust = useCallback(
    (delta: number) => {
      const order: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
      const current = DIFFICULTY_RANK[lastInput.current.difficulty];
      const next = order[Math.max(0, Math.min(2, current + delta))];
      void send(lastInput.current.text, next);
    },
    [send],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <DisclaimerBanner />
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <MessageBubble message={item} onEasier={() => adjust(-1)} onHarder={() => adjust(1)} />
          )}
        />
        <PromptChips onSelect={(t) => void send(t)} />
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.background }}>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Where do you feel tension?"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              onSubmitEditing={() => void send(draft)}
              returnKeyType="send"
            />
            <Pressable onPress={() => void send(draft)} style={[styles.sendBtn, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Send</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.one },
  inputRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  input: { flex: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  sendBtn: { borderRadius: 999, paddingHorizontal: Spacing.four, justifyContent: 'center' },
});
