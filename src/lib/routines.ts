import AsyncStorage from '@react-native-async-storage/async-storage';

import { Recommendation } from '@/core/types';

export interface Routine {
  id: string;
  name: string;
  createdAt: string;
  items: Recommendation[];
}

export const ROUTINES_KEY = 'flexai:routines';
let seq = 0;
const newId = () => `r${Date.now()}_${seq++}`;

export async function getRoutines(): Promise<Routine[]> {
  const raw = await AsyncStorage.getItem(ROUTINES_KEY);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as Routine[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

async function persist(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export async function addToRoutine(name: string, rec: Recommendation): Promise<Routine[]> {
  const trimmed = name.trim();
  if (!trimmed) return getRoutines();
  const routines = await getRoutines();
  const existing = routines.find((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    existing.items.push(rec);
  } else {
    routines.push({ id: newId(), name: trimmed, createdAt: new Date().toISOString(), items: [rec] });
  }
  await persist(routines);
  return routines;
}

export async function removeItem(routineId: string, index: number): Promise<Routine[]> {
  const routines = await getRoutines();
  const r = routines.find((x) => x.id === routineId);
  if (r) r.items.splice(index, 1);
  await persist(routines);
  return routines;
}

export async function deleteRoutine(id: string): Promise<Routine[]> {
  const routines = (await getRoutines()).filter((r) => r.id !== id);
  await persist(routines);
  return routines;
}

export async function replaceRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}
