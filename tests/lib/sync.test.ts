import AsyncStorage from '@react-native-async-storage/async-storage';
import { backupToCloud, restoreFromCloud } from '@/lib/sync';
import { addToRoutine, getRoutines } from '@/lib/routines';

beforeEach(async () => { await AsyncStorage.clear(); });

const recX = {
  name: 'a', type: 'mobility' as const, target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner' as const, safety_notes: ['n'], media_prompt: 'p',
};

function fakeClient(opts: { cloud?: any }) {
  const captured: any = {};
  return {
    captured,
    auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'e@x.com' } } }) },
    from() {
      return {
        upsert: async (row: any) => { captured.upserted = row; return { error: null }; },
        select() { return this; },
        eq() { return this; },
        single: async () => ({ data: opts.cloud ?? null, error: null }),
      };
    },
  } as any;
}

describe('sync', () => {
  it('backupToCloud upserts the local data for the signed-in user', async () => {
    await addToRoutine('R', recX);
    const client = fakeClient({});
    const r = await backupToCloud(client);
    expect(r.ok).toBe(true);
    expect(client.captured.upserted.user_id).toBe('u1');
    expect(client.captured.upserted.routines[0].name).toBe('R');
  });

  it('restoreFromCloud writes cloud data into local stores', async () => {
    const client = fakeClient({ cloud: { routines: [{ id: 'r1', name: 'Cloud', createdAt: 't', items: [recX] }], history: [], profile: {} } });
    const r = await restoreFromCloud(client);
    expect(r.ok).toBe(true);
    expect((await getRoutines())[0].name).toBe('Cloud');
  });

  it('fails gracefully with no client', async () => {
    expect((await backupToCloud(null)).ok).toBe(false);
  });
});
