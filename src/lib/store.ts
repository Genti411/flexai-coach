import AsyncStorage from '@react-native-async-storage/async-storage';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProfilePrefs {
  fitnessLevel?: FitnessLevel;
  goals?: string;
}

export interface ConsentRecord {
  accepted: boolean;
  acceptedAt: string | null;
}

export interface LocalData {
  consent: ConsentRecord;
  profile: ProfilePrefs;
}

const CONSENT_KEY = 'flexai:consent';
const PROFILE_KEY = 'flexai:profile';
const DEFAULT_CONSENT: ConsentRecord = { accepted: false, acceptedAt: null };

export async function getConsent(): Promise<ConsentRecord> {
  const raw = await AsyncStorage.getItem(CONSENT_KEY);
  if (!raw) return DEFAULT_CONSENT;
  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    return { accepted: !!parsed.accepted, acceptedAt: parsed.acceptedAt ?? null };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export async function setConsentAccepted(): Promise<ConsentRecord> {
  const record: ConsentRecord = { accepted: true, acceptedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  return record;
}

export async function getProfile(): Promise<ProfilePrefs> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProfilePrefs;
  } catch {
    return {};
  }
}

export async function setProfile(p: ProfilePrefs): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export async function exportData(): Promise<LocalData> {
  const [consent, profile] = await Promise.all([getConsent(), getProfile()]);
  return { consent, profile };
}

export async function deleteData(): Promise<void> {
  await AsyncStorage.multiRemove([CONSENT_KEY, PROFILE_KEY]);
}
