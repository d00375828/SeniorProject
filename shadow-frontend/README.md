# Shadow Frontend

Shadow is an Expo mobile app for voice-first roleplay practice. The app lets a user choose a scenario, configure the session, speak one turn at a time, hear the AI partner reply, and finish with a coaching summary that can be saved locally.

## Product Flow

`Home -> Setup -> Session -> Summary -> History`

- `Home`: local scenario catalog
- `Setup`: role, objective, and partner style
- `Session`: record one turn, submit audio, receive transcript + AI reply + AI voice, retry failed turns, end session
- `Summary`: transcript and coaching summary
- `History`: locally saved completed sessions

## Frontend Architecture

- `app/`: Expo Router screens for the roleplay flow
- `context/session.tsx`: active session state, retry handling, local save/load
- `context/types.ts`: normalized app types for scenarios, turns, summaries, and saved sessions
- `hooks/useRecorder.ts`: microphone permission and per-turn recording
- `lib/roleplay/client.ts`: backend contract for `/roleplay/turn` and `/roleplay/end`
- `lib/roleplay/scenarios.ts`: typed local scenario catalog
- `components/`: shared UI and playback components

## Backend Contract

The frontend expects these endpoints:

- `POST /roleplay/turn`
  - request: session config, prior turn history, latest recorded audio
  - response: user transcript, assistant text, assistant audio
- `POST /roleplay/end`
  - request: session config and full turn history
  - response: transcript, overview, wins, drills, next step

## Environment

Set the mobile app backend URL in [shadow-frontend/.env](/Users/thegoat/Desktop/senior_project/SeniorProject/shadow-frontend/.env):

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

Restart Expo after changing env values:

```bash
cd shadow-frontend
npx expo start -c
```

## Notes

- AI voice playback is required for a turn to count as successful.
- Saved sessions store config, transcript history, and summary only.
- In-progress sessions are not persisted in v1.

## Reference

See [NEWcore-diagrams.md](/Users/thegoat/Desktop/senior_project/SeniorProject/shadow-frontend/docs/NEWcore-diagrams.md) for the current architecture diagrams.
