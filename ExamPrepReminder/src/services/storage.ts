import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings { remindersEnabled: boolean }
export const DEFAULT_SETTINGS: Settings = { remindersEnabled: true };

const SETTINGS_KEY = 'settings:v1';
const noteKey = (id: string) => `notes:${id}`;

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const saveSettings = (s: Settings) => AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
export const loadNote = async (id: string) => (await AsyncStorage.getItem(noteKey(id))) ?? '';
export const saveNote = (id: string, text: string) => AsyncStorage.setItem(noteKey(id), text);
