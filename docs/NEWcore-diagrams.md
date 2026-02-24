# Core System Diagrams for NEW architecture

## 1) Flow Diagram (Core User Flow)

```mermaid
flowchart TD
    A[Open app] --> D[Go to Home]

    D --> S[Choose roleplay scenario<br/>(Interview / Presentation / Hard conversation)]
    S --> C[Configure roleplay<br/>(role, tone, difficulty, goals)]

    C --> R[Start roleplay session]

    %% Turn loop (push-to-talk)
    R --> T{Push-to-talk?}
    T -- Hold --> U[Capture speech chunk]
    U --> V[Send audio turn to Roleplay API]
    V --> W{Turn success?}

    W -- Yes --> X[Receive: user transcript + AI text + AI voice]
    X --> Y[Play AI voice response]
    Y --> T

    W -- No --> Z[Show error + retry]
    Z --> T

    %% End session + coaching
    R --> E[End session]
    E --> F[Send full session transcript/history to Summary API]
    F --> G{Summary success?}
    G -- Yes --> H[Show coaching summary<br/>Transcript + wins + improvement bullets + drills]
    G -- No --> I[Show error + retry summary]
    I --> F

    %% Optional local save
    H --> J{Save session locally?}
    J -- Yes --> K[Save to device (SQLite or local storage)]
    J -- No --> L[Return to Home]
    K --> L
```

## 2) Component Diagram

```mermaid
flowchart LR
    U[User]

    subgraph APP[Shadow Confidence Builder App (Mobile)]
      UI[UI Layer<br/>Home, Scenario Setup, Roleplay Session, Summary]
      STATE[App State Layer<br/>Session State, History (optional), Settings]
      REC[Recorder Service<br/>Push-to-talk capture, chunk encoding]
      PLAYER[Audio Playback Service<br/>Play AI voice, pause/stop]
      ROLEPLAY[Roleplay Session Manager<br/>Turn loop, history buffer, retries]
      API[API Client<br/>Upload audio turn, request summary]
      LOCAL[(Local Persistence - Optional<br/>SQLite or AsyncStorage)]
    end

    subgraph BACKEND[Tiny Roleplay Backend API]
      TURN[Turn Endpoint<br/>POST /roleplay/turn]
      SUMMARY[Summary Endpoint<br/>POST /roleplay/end]
      ORCH[Orchestrator<br/>STT → LLM → TTS]
    end

    subgraph AI[Gemini Services]
      STT[Speech-to-Text]
      LLM[Roleplay LLM Response]
      TTS[Text-to-Speech]
    end

    U --> UI
    UI --> STATE
    UI --> REC
    UI --> PLAYER
    UI --> ROLEPLAY

    ROLEPLAY --> API
    API --> TURN
    API --> SUMMARY

    TURN --> ORCH
    SUMMARY --> ORCH

    ORCH --> STT
    ORCH --> LLM
    ORCH --> TTS

    STATE <--> LOCAL
    TURN --> API
    SUMMARY --> API
    API --> ROLEPLAY
    PLAYER --> UI
```

## 3) Sequence Diagram

```mermaid
sequenceDiagram
    actor U as User
    participant UI as UI Layer
    participant ROLE as Roleplay Session Manager
    participant REC as Recorder Service
    participant API as API Client
    participant TURN as Roleplay API (/roleplay/turn)
    participant ORCH as Orchestrator (STT→LLM→TTS)
    participant GEM as Gemini (STT/LLM/TTS)
    participant PLAY as Audio Playback
    participant SUM as Summary API (/roleplay/end)
    participant LOCAL as Local Save (optional)

    U->>UI: Choose scenario + start session
    UI->>ROLE: initSession(config)
    ROLE-->>UI: Session ready

    loop Each push-to-talk turn
        U->>UI: Hold to talk
        UI->>REC: start()
        REC-->>UI: recording...
        U->>UI: Release to stop
        UI->>REC: stop()
        REC-->>UI: audioChunkUri

        UI->>ROLE: submitTurn(audioChunkUri)
        ROLE->>API: POST turn(audioChunk, history, config)
        API->>TURN: /roleplay/turn

        TURN->>ORCH: processTurn(audio, history, config)
        ORCH->>GEM: STT(audio)
        GEM-->>ORCH: userTranscript
        ORCH->>GEM: LLM(history + config + userTranscript)
        GEM-->>ORCH: assistantText
        ORCH->>GEM: TTS(assistantText)
        GEM-->>ORCH: assistantAudio
        ORCH-->>TURN: transcript + assistantText + assistantAudio
        TURN-->>API: turnResponse
        API-->>ROLE: turnResponse
        ROLE-->>UI: update captions + readyToPlay(audio)
        UI->>PLAY: play(assistantAudio)
        PLAY-->>UI: playback ended
    end

    U->>UI: End session
    UI->>ROLE: endSession()
    ROLE->>API: POST summary(fullHistory, config)
    API->>SUM: /roleplay/end

    SUM->>ORCH: summarizeSession(history, config)
    ORCH->>GEM: LLM(finalTranscript + rubric prompt)
    GEM-->>ORCH: coachingSummaryJSON
    ORCH-->>SUM: transcript + bullets + wins + drills
    SUM-->>API: summaryResponse
    API-->>ROLE: summaryResponse
    ROLE-->>UI: showSummary(summaryResponse)

    opt Save locally
        UI->>LOCAL: save(session + summary)
        LOCAL-->>UI: saved
    end
```

## 4) System Context Diagram

```mermaid
flowchart TB
    USER[Individual User]
    APP[Shadow Mobile App<br/>Confidence Roleplay]
    MIC[Device Microphone]
    SPK[Device Speaker / Audio Output]
    LOCAL[(Local Device Storage<br/>Optional SQLite/AsyncStorage)]
    ROLEAPI[Roleplay Backend API]
    GEMINI[Gemini Services<br/>STT + LLM + TTS]

    USER --> APP
    APP --> MIC
    APP --> SPK
    APP <--> LOCAL
    APP --> ROLEAPI
    ROLEAPI --> GEMINI
```
