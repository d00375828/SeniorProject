# Core System Diagrams (Rep App)

## 1) Flow Diagram (Core User Flow)

```mermaid
flowchart TD
    A[Open app] --> B[Sign in]
    B --> C{Authenticated?}
    C -- Yes --> D[Go to Home]
    C -- No --> B

    D --> E{Record new audio?}
    E -- Yes --> F[Capture audio]
    E -- No --> G[Upload existing audio]

    F --> H[Send audio for grading]
    G --> H

    H --> I{Grading success?}
    I -- Yes --> J[Save result to history]
    I -- No --> K[Show error and retry]
    K --> E

    J --> L[View recording details and insights]
    L --> M{Open chat for coaching?}
    M -- Yes --> N[Send message and receive AI response]
    M -- No --> O[End session]
    N --> O
```

## 2) Component Diagram (Core Runtime Components)

```mermaid
flowchart LR
    U[Rep User]

    subgraph APP[Shadow Mobile App]
      UI[UI Layer\nLogin Home Recordings Insights Chat]
      STATE[App State Layer\nAuth Profile Recordings Theme]
      REC[Recorder Service\nMic Capture and File Handling]
      CHAT[Chat Service\nMessage Client]
      STORE[(Local Storage\nAsyncStorage)]
    end

    GRADE[Grading API\nAudio Scoring and Transcript]
    CHATAPI[Chat API\nCoaching Response]

    U --> UI
    UI --> STATE
    UI --> REC
    UI --> CHAT
    STATE <--> STORE
    REC --> GRADE
    CHAT --> CHATAPI
    GRADE --> STATE
    CHATAPI --> CHAT
```

## 3) Sequence Diagram (Same Components, Detailed Interaction)

```mermaid
sequenceDiagram
    actor U as Rep User
    participant UI as UI Layer
    participant STATE as App State Layer
    participant REC as Recorder Service
    participant CHAT as Chat Service
    participant STORE as Local Storage
    participant GRADE as Grading API
    participant CHATAPI as Chat API

    U->>UI: Sign in
    UI->>STATE: signIn(username)
    STATE->>STORE: Persist auth flag
    STORE-->>STATE: OK
    STATE-->>UI: Authenticated

    U->>UI: Start recording
    UI->>REC: start()
    REC-->>UI: Recording active

    U->>UI: Stop and submit
    UI->>REC: stop()
    REC-->>UI: audioUri
    UI->>REC: sendRecordingForGrade(audioUri)
    REC->>GRADE: POST audio/m4a

    alt Grading successful
        GRADE-->>REC: transcript + metrics + overallScore
        REC-->>UI: grade result
        UI->>STATE: addRecording(result)
        STATE->>STORE: Persist history/avg/criteria
        STORE-->>STATE: OK
        STATE-->>UI: Updated history
    else Grading failed
        GRADE-->>REC: error
        REC-->>UI: error
        UI-->>U: Show retry message
    end

    U->>UI: Send coaching question
    UI->>CHAT: sendChatMessage(text)
    CHAT->>CHATAPI: POST /chat

    alt Chat successful
        CHATAPI-->>CHAT: response text
        CHAT-->>UI: assistant message
    else Chat failed
        CHATAPI-->>CHAT: error
        CHAT-->>UI: fallback message + error state
    end
```

## 4) System Context Diagram (Rep Scope)

```mermaid
flowchart TB
    REP[Sales Rep]
    APP[[Shadow Mobile App\nRep Experience]]
    MIC[Device Microphone]
    FILES[Device Files\nDocument Picker]
    STORAGE[(Local Device Storage\nAsyncStorage)]
    GRADEAPI[Grading Backend API]
    CHATAPI[Chat Backend API]

    REP --> APP
    APP --> MIC
    APP --> FILES
    APP <--> STORAGE
    APP --> GRADEAPI
    APP --> CHATAPI
```
