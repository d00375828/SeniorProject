export type SessionRole = "user" | "assistant";

export type SessionConfig = {
  scenarioId: string;
  userRole: string;
  objective: string;
  partnerStyle: string;
};

export type ScenarioDefinition = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Warm-up" | "Core" | "Advanced";
  persona: string;
  defaultConfig: Omit<SessionConfig, "scenarioId">;
};

export type SessionTurn = {
  id: string;
  role: SessionRole;
  text: string;
  createdAt: number;
};

export type FailedTurnPreview = {
  userTranscript: string;
  assistantText: string;
};

export type SessionStatus =
  | "idle"
  | "ready"
  | "recording"
  | "submitting"
  | "playing"
  | "ending"
  | "summary-ready";

export type TurnResponse = {
  userTranscript: string;
  assistantText: string;
  assistantAudioUri?: string | null;
  assistantAudioMimeType?: string | null;
};

export type SessionSummary = {
  transcript: string;
  overview: string;
  wins: string[];
  drills: string[];
  nextStep: string;
};

export type ActiveSession = {
  id: string;
  scenario: ScenarioDefinition;
  config: SessionConfig;
  turns: SessionTurn[];
  status: SessionStatus;
  latestAssistantText: string | null;
  latestAssistantAudioUri: string | null;
  lastTurnAudioUri: string | null;
  lastTurnIds: string[] | null;
  failedTurnPreview: FailedTurnPreview | null;
  error: string | null;
  createdAt: number;
};

export type SavedSession = {
  id: string;
  createdAt: number;
  scenario: ScenarioDefinition;
  config: SessionConfig;
  turns: SessionTurn[];
  summary: SessionSummary;
};
