import type { SupabaseClient } from '@supabase/supabase-js';

import { getHistory, replaceHistory } from '@/lib/history';
import { getRoutines, replaceRoutines } from '@/lib/routines';
import { getProfile, setProfile } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export type SyncResult = { ok: true } | { ok: false; error: string };

const TABLE = 'user_data';

export async function backupToCloud(client: SupabaseClient | null = supabase): Promise<SyncResult> {
  if (!client) return { ok: false, error: 'Cloud sync is not configured' };
  const { data } = await client.auth.getUser();
  const user = data?.user;
  if (!user) return { ok: false, error: 'Not signed in' };
  const [routines, history, profile] = await Promise.all([getRoutines(), getHistory(), getProfile()]);
  const { error } = await client
    .from(TABLE)
    .upsert({ user_id: user.id, routines, history, profile, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function restoreFromCloud(client: SupabaseClient | null = supabase): Promise<SyncResult> {
  if (!client) return { ok: false, error: 'Cloud sync is not configured' };
  const { data: userData } = await client.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: 'Not signed in' };
  // maybeSingle so a brand-new account with no backup yet returns null (not an error).
  const { data, error } = await client.from(TABLE).select('routines,history,profile').eq('user_id', user.id).maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (data) {
    await replaceRoutines(data.routines ?? []);
    await replaceHistory(data.history ?? []);
    await setProfile(data.profile ?? {});
  }
  return { ok: true };
}
