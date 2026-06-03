import { Link } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { addHistory } from '@/lib/history';
import { getProfile } from '@/lib/store';

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
  const [busy, setBusy] = useState(false);
  const [weights, setWeights] = useState(false);
  // Synchronous guard: two taps in the same tick both pass a state check before it
  // updates, so serialize on a ref to avoid concurrent requests scrambling state.
  const busyRef = useRef(false);
  const historyEnabledRef = useRef(false);
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    getProfile().then((p) => {
      historyEnabledRef.current = !!p.historyEnabled;
      historyLoadedRef.current = true;
    });
  }, []);

  const send = useCallback(
    async (raw: string, difficulty: Difficulty = 'beginner') => {
      const text = raw.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      lastInput.current = { text, difficulty };
      const userMsg: ChatMessage = { id: nextId(), role: 'user', kind: 'text', text };
      setMessages((prev) => [...prev, userMsg]);
      setDraft('');
      // Light-weights mode surfaces the weighted (advanced) variants in the dataset.
      // Safety still gates them: the engine drops weighted items at medium/high risk.
      const diff = weights ? 'advanced' : difficulty;
      const parts: string[] = [];
      if (diff !== 'beginner') parts.push(diff);
      parts.push(text);
      if (weights && !/weight|dumbbell|kettlebell|barbell|band/i.test(text)) parts.push('with weights');
      const prompt = parts.join(' ');
      try {
        const response = await getStretchResponse(prompt);
        setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', kind: 'response', response }]);
        const historyOn = historyLoadedRef.current
          ? historyEnabledRef.current
          : (await getProfile()).historyEnabled;
        if (historyOn) {
          void addHistory({
            ts: new Date().toISOString(),
            query: text,
            bodyArea: response.body_area,
            count: response.recommendations.length,
          });
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [weights],
  );

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
        <View style={styles.header}>
          <ThemedText type="smallBold">FlexAI Coach</ThemedText>
          <View style={styles.headerLinks}>
            <Link href="/body-map" asChild>
              <Pressable><ThemedText type="link">Body</ThemedText></Pressable>
            </Link>
            <Link href="/routines" asChild>
              <Pressable><ThemedText type="link">Routines</ThemedText></Pressable>
            </Link>
            <Link href="/history" asChild>
              <Pressable><ThemedText type="link">History</ThemedText></Pressable>
            </Link>
            <Link href="/legal" asChild>
              <Pressable><ThemedText type="link">Legal</ThemedText></Pressable>
            </Link>
            <Link href="/settings" asChild>
              <Pressable><ThemedText type="link">Settings</ThemedText></Pressable>
            </Link>
          </View>
        </View>
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
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setWeights((v) => !v)}
            accessibilityRole="switch"
            accessibilityState={{ checked: weights }}
            style={[styles.toggle, { backgroundColor: weights ? theme.accent : theme.backgroundElement }]}
          >
            <ThemedText type="small" themeColor={weights ? 'accentText' : 'text'}>
              Light weights: {weights ? 'on' : 'off'}
            </ThemedText>
          </Pressable>
        </View>
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
            <Pressable
              onPress={() => void send(draft)}
              disabled={busy}
              style={[styles.sendBtn, { backgroundColor: theme.accent, opacity: busy ? 0.5 : 1 }]}
            >
              <ThemedText type="small" themeColor="accentText">{busy ? '...' : 'Send'}</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  headerLinks: { flexDirection: 'row', gap: Spacing.three },
  list: { padding: Spacing.three, gap: Spacing.one },
  toggleRow: { flexDirection: 'row', paddingHorizontal: Spacing.three, paddingBottom: Spacing.one },
  toggle: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 999 },
  inputRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  input: { flex: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  sendBtn: { borderRadius: 999, paddingHorizontal: Spacing.four, justifyContent: 'center' },
});
