import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteData, exportData, getConsent, getProfile, setConsentAccepted, setProfile } from '@/lib/store';
import { addToRoutine } from '@/lib/routines';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('store', () => {
  it('returns a default (not accepted) consent record when nothing is stored', async () => {
    const c = await getConsent();
    expect(c.accepted).toBe(false);
    expect(c.acceptedAt).toBeNull();
  });

  it('records consent with a timestamp', async () => {
    const rec = await setConsentAccepted();
    expect(rec.accepted).toBe(true);
    expect(typeof rec.acceptedAt).toBe('string');
    const read = await getConsent();
    expect(read.accepted).toBe(true);
    expect(read.acceptedAt).toBe(rec.acceptedAt);
  });

  it('round-trips profile preferences', async () => {
    await setProfile({ fitnessLevel: 'intermediate', goals: 'reduce neck tension' });
    const p = await getProfile();
    expect(p.fitnessLevel).toBe('intermediate');
    expect(p.goals).toBe('reduce neck tension');
  });

  it('exports consent and profile together', async () => {
    await setConsentAccepted();
    await setProfile({ fitnessLevel: 'beginner' });
    const data = await exportData();
    expect(data.consent.accepted).toBe(true);
    expect(data.profile.fitnessLevel).toBe('beginner');
  });

  it('deletes all local data', async () => {
    await setConsentAccepted();
    await setProfile({ goals: 'x' });
    await deleteData();
    expect((await getConsent()).accepted).toBe(false);
    expect(await getProfile()).toEqual({});
  });

  it('export includes routines and delete clears them', async () => {
    await addToRoutine('R', {
      name: 'a', type: 'mobility', target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
      duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['n'], media_prompt: 'p',
    });
    const data = await exportData();
    expect(data.routines).toHaveLength(1);
    await deleteData();
    expect((await exportData()).routines).toEqual([]);
  });
});
