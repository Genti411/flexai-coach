import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToRoutine, deleteRoutine, getRoutines, removeItem, replaceRoutines } from '@/lib/routines';
import { Recommendation } from '@/core/types';

const rec = (name: string): Recommendation => ({
  name, type: 'mobility', target_muscles: ['x'], instructions: ['a'], sets: 1, reps: 1,
  duration: '5s', equipment: 'none', weighted: false, difficulty: 'beginner', safety_notes: ['n'], media_prompt: 'p',
});

beforeEach(async () => { await AsyncStorage.clear(); });

describe('routines store', () => {
  it('starts empty', async () => { expect(await getRoutines()).toEqual([]); });

  it('adding creates a new routine with the item', async () => {
    await addToRoutine('Morning', rec('Chin Tucks'));
    const rs = await getRoutines();
    expect(rs).toHaveLength(1);
    expect(rs[0].name).toBe('Morning');
    expect(rs[0].items.map((i) => i.name)).toEqual(['Chin Tucks']);
  });

  it('adding to an existing name (case-insensitive) appends', async () => {
    await addToRoutine('Morning', rec('Chin Tucks'));
    await addToRoutine('morning', rec('Cat-Cow'));
    const rs = await getRoutines();
    expect(rs).toHaveLength(1);
    expect(rs[0].items.map((i) => i.name)).toEqual(['Chin Tucks', 'Cat-Cow']);
  });

  it('ignores blank names', async () => {
    await addToRoutine('   ', rec('x'));
    expect(await getRoutines()).toEqual([]);
  });

  it('replaceRoutines overwrites the stored list', async () => {
    await addToRoutine('A', rec('x'));
    await replaceRoutines([]);
    expect(await getRoutines()).toEqual([]);
  });

  it('removeItem drops one item, deleteRoutine removes the routine', async () => {
    await addToRoutine('R', rec('a'));
    await addToRoutine('R', rec('b'));
    const [{ id }] = await getRoutines();
    await removeItem(id, 0);
    expect((await getRoutines())[0].items.map((i) => i.name)).toEqual(['b']);
    await deleteRoutine(id);
    expect(await getRoutines()).toEqual([]);
  });
});
