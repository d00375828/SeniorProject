# Core System Diagrams for OG architecture

## 1) Flow Diagram (Core User Flow)

```mermaid
flowchart TD
    A[Open app] --> B[Sign in]
    B --> C{Authenticated?}
    C -- Yes --> D[Go to Home]
    C -- No --> B

    %% Two main paths from Home
    D --> E{Record new audio?}
    D --> F{Open chat for coaching?}

    %% Recording path
    E -- Yes --> G[Capture audio]
    E -- No --> H[Upload existing audio]
    G --> J[Send audio for grading]
    H --> J

    J --> K{Grading success?}
    K -- Yes --> L[Save result to history]
    K -- No --> M[Show error and retry]
    M --> E

    L --> N[View recording details and insights]
    N --> O[End session]

    %% Chat path
    F -- Yes --> I[Send message and receive AI response]
    I --> O
```

## 2) Component Diagram

```mermaid
flowchart LR
    U[Rep User]

    subgraph APP[Shadow Mobile App]
      UI[UI Layer Login Home Recordings Insights Chat]
      STATE[App State Layer Auth Profile Recordings Theme]
      REC[Recorder Service Mic Capture and File Handling]
      CHAT[Chat Service Message Client]
      STORE[(Local Storage AsyncStorage)]
    end

    GRADE[Grading API Audio Scoring and Transcript]
    CHATAPI[Chat API Coaching Response]

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

## 3) Sequence Diagram

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

## 4) System Context Diagram

```mermaid
flowchart TB
    REP[Sales Rep]
    APP[[Shadow Mobile App Rep Experience]]
    MIC[Device Microphone]
    FILES[Device Files Document Picker]
    STORAGE[(Local Device Storage AsyncStorage)]
    GRADEAPI[Grading Backend API]
    CHATAPI[Chat Backend API]

    REP --> APP
    APP --> MIC
    APP --> FILES
    APP <--> STORAGE
    APP --> GRADEAPI
    APP --> CHATAPI
```
