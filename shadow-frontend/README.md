graph TD
    Start([User Opens App]) --> Scenario[Choose Scenario]
    Scenario --> Config[Configure Context]
    Config --> Session[Start Session]
    
    subgraph Loop [Interaction Loop]
    Record[Press & Hold to Record] --> Process[App Stops & Sends Audio + Config]
    Process --> Backend[Backend Returns Transcript + AI Audio]
    Backend --> Play[App Updates History & Plays AI Audio]
    Play -.-> Record
    end

    Play --> End[User Taps End Session]
    End --> Final[Backend Processes Summary & Scores]
    Final --> Summary([Show Summary Screen])

    ##  User Flow

### 1. Initial Setup
* **Open Application:** Launch the app to begin.
* **Select Scenario:** Choose the specific environment or simulation.
* **Configure Context:** Set the parameters and goals for the session.
* **Start Session:** Initialize the live interaction.

### 2. Interaction Loop
* **Record:** User presses and holds the record button to speak.
* **Process:** Upon release, the app captures the audio and sends it to the backend along with the current conversation history and configuration.
* **Response:** The backend processes the input and returns:
    * User Transcript
    * AI Text Response
    * AI Generated Audio
* **Playback:** The app updates the conversation history UI and plays the AI audio response.
* **Repeat:** This cycle continues until the user chooses to conclude the session.

### 3. Session Wrap-up & Analysis
* **End Session:** User taps to finish the interaction.
* **Final Evaluation:** The app sends the full session history to the backend for analysis.
* **Feedback Generation:** The backend returns a comprehensive breakdown including:
    * **Performance Scores** and a **Summary**
    * **Strengths** and **Areas for Improvement**
    * **Targeted Drills** for future practice.
* **Review:** The user is presented with the final **Summary Screen**.


## 🚀 Future Roadmap (Deferred Features)

While the core functionality is the current focus, the following features are planned for future development as time permits:

* **User Authentication:** Secure login and personalized user profiles.
* **Server-Side Database:** Persistent storage for user data and session logs.
* **Analytics Dashboard:** Visual representation of performance trends over time.
* **Real-time Streaming:** Immediate audio processing for lower latency.
* **Websockets:** Enhanced bi-directional communication for more fluid interactions.
* **Multi-User Support:** Collaboration or competitive modes between different accounts.
* **Long-Term Progress Tracking:** Historical data analysis to monitor growth across multiple sessions.
