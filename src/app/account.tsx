import type { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getSession, sendCode, signOut, verifyCode } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { backupToCloud, restoreFromCloud } from '@/lib/sync';
import { useTheme } from '@/hooks/use-theme';

export default function AccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getSession().then(setSession);
  }, []);

  const doSend = async () => {
    const r = await sendCode(email.trim());
    setStatus(r.ok ? 'Code sent. Check your email.' : r.error);
    if (r.ok) setCodeSent(true);
  };
  const doVerify = async () => {
    const r = await verifyCode(email.trim(), code.trim());
    if (r.ok) {
      setSession(await getSession());
      setStatus('Signed in.');
      setCode('');
      setCodeSent(false);
    } else setStatus(r.error);
  };
  const doBackup = async () => {
    const r = await backupToCloud();
    setStatus(r.ok ? 'Backed up to cloud.' : r.error);
  };
  const doRestore = async () => {
    const r = await restoreFromCloud();
    setStatus(r.ok ? 'Restored from cloud.' : r.error);
  };
  const doSignOut = async () => {
    await signOut();
    setSession(null);
    setStatus('Signed out.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <ThemedText type="link">{'‹'} Back</ThemedText>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Account</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Optional. The app works fully without an account. Sign in only if you want to back up your routines and history across devices.
        </ThemedText>

        {!isSupabaseConfigured ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.h}>
            Cloud sync is not configured in this build. Accounts become available once the developer sets up Supabase.
          </ThemedText>
        ) : session ? (
          <View style={styles.section}>
            <ThemedText type="smallBold">Signed in as {session.user.email}</ThemedText>
            <Pressable onPress={() => void doBackup()} style={[styles.btn, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Back up to cloud</ThemedText>
            </Pressable>
            <Pressable onPress={() => void doRestore()} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small">Restore from cloud (replaces local)</ThemedText>
            </Pressable>
            <Pressable onPress={() => void doSignOut()} style={[styles.btn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="danger">Sign out</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable onPress={() => void doSend()} style={[styles.btn, { backgroundColor: theme.accent }]}>
              <ThemedText type="small" themeColor="accentText">Send sign-in code</ThemedText>
            </Pressable>
            {codeSent && (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="number-pad"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
                <Pressable onPress={() => void doVerify()} style={[styles.btn, { backgroundColor: theme.accent }]}>
                  <ThemedText type="small" themeColor="accentText">Verify & sign in</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        )}
        {status && <ThemedText type="small" themeColor="accent" style={styles.h}>{status}</ThemedText>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  content: { padding: Spacing.three, gap: Spacing.one },
  h: { marginTop: Spacing.three },
  section: { gap: Spacing.two, marginTop: Spacing.two },
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  btn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, alignSelf: 'flex-start' },
});
