import { useCallback, useEffect, useState } from 'react';
import { cancelExamReminders, ensurePermissions, scheduleExamReminders } from '../services/notifications';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from '../services/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setReady(true); });
  }, []);

  /** Toggles reminders; returns false if the OS permission was denied. */
  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      if (!(await ensurePermissions())) return false;
      await scheduleExamReminders();
    } else {
      await cancelExamReminders();
    }
    const next = { ...settings, remindersEnabled: enabled };
    setSettings(next);
    await saveSettings(next);
    return true;
  }, [settings]);

  return { settings, ready, setRemindersEnabled };
}
