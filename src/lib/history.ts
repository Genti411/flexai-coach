import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryEntry {
  ts: string;
  query: string;
  bodyArea: string;
  count: number;
}

export const HISTORY_KEY = 'flexai:history';
const MAX = 50;

export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const list = await getHistory();
  const next = [entry, ...list].slice(0, MAX);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

export async function replaceHistory(entries: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX)));
}
