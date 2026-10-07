# ExamPrepReminder

Expo (React Native + TypeScript) app: exam countdown, 19:00 evening reminders the day before each exam, and study hubs (summary & formulas, flashcards, quizzes, personal notes).

## Run
```bash
npm install
npx expo start      # press a / i / w, or scan the QR with Expo Go
```
Local notifications work on devices/emulators (not on web). On Android 13+ / iOS the app asks for permission.
For full notification behaviour use a development build (`npx expo run:android`), since Expo Go has limits.

## Structure
- `app/` – Expo Router screens: `(tabs)/index` (dashboard), `schedule`, `settings`, `subject/[id]` (study hub)
- `src/data/` – exam schedule (`exams.ts`, year in `EXAM_YEAR`) and per-subject content (`subjects/*.ts`)
- `src/services/notifications.ts` – scheduling, permissions, test notification; `storage.ts` – AsyncStorage
- `src/components/` – FlipCard, Quiz, Countdown, NotesEditor, …

## Customising
Edit/add content in `src/data/subjects/<subject>.ts` (summary, formulas, flashcards, quiz).
Exam start hour and reminder hour: `src/data/exams.ts`.
