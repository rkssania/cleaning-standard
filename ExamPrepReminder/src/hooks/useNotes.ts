import { useEffect, useRef, useState } from 'react';
import { loadNote, saveNote } from '../services/storage';

type Status = 'idle' | 'saving' | 'saved';

/** Loads a subject's notes and auto-saves edits (debounced) to AsyncStorage. */
export function useNotes(subjectId: string) {
  const [text, setTextState] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loaded.current = false;
    loadNote(subjectId).then((t) => { setTextState(t); loaded.current = true; });
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [subjectId]);

  const setText = (value: string) => {
    setTextState(value);
    if (!loaded.current) return;
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await saveNote(subjectId, value);
      setStatus('saved');
    }, 500);
  };

  return { text, setText, status };
}
