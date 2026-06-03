import AsyncStorage from '@react-native-async-storage/async-storage';
import { addHistory, clearHistory, getHistory, replaceHistory, HistoryEntry } from '@/lib/history';

const e = (query: string): HistoryEntry => ({ ts: new Date().toISOString(), query, bodyArea: 'neck', count: 3 });

beforeEach(async () => { await AsyncStorage.clear(); });

describe('history store', () => {
  it('starts empty', async () => { expect(await getHistory()).toEqual([]); });

  it('addHistory prepends (most recent first)', async () => {
    await addHistory(e('first'));
    await addHistory(e('second'));
    expect((await getHistory()).map((x) => x.query)).toEqual(['second', 'first']);
  });

  it('caps at 50 entries', async () => {
    for (let i = 0; i < 55; i++) await addHistory(e(`q${i}`));
    const all = await getHistory();
    expect(all).toHaveLength(50);
    expect(all[0].query).toBe('q54');
  });

  it('replaceHistory overwrites and caps at 50', async () => {
    await replaceHistory(Array.from({ length: 60 }, (_, i) => ({ ts: 't', query: `q${i}`, bodyArea: 'neck', count: 1 })));
    expect(await getHistory()).toHaveLength(50);
  });

  it('clearHistory empties it', async () => {
    await addHistory(e('x'));
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });
});
