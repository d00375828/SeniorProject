export type SessionRole = "user" | "assistant";

export type AttachmentKind =
  | "slides"
  | "instructions"
  | "rubric"
  | "resume"
  | "job-listing"
  | "notes";

export type SessionAttachment = {
  id: string;
  name: string;
  mimeType: string;
  kind: AttachmentKind;
  extractedText: string;
  promptText: string;
};

export type SessionConfig = {
  scenarioId: string;
  userRole: string;
  objective: string;
  partnerStyle: string;
  attachments?: SessionAttachment[];
  summaryTemplate?: SummaryTemplate;
};

export type SummaryMode = "objective" | "emotional" | "delivery" | "pressure";

export type SummarySectionKind =
  | "takeaway"
  | "bullets"
  | "metrics"
  | "transcript"
  | "quote"
  | "job-coverage"
  | "reflection"
  | "rewrite"
  | "question-review"
  | "study-topics";

export type SummarySectionSpec = {
  key: string;
  title: string;
  kind: SummarySectionKind;
  maxItems?: number;
  requiresAttachmentKind?: AttachmentKind;
};

export type SummaryTemplate = {
  mode: SummaryMode;
  introLabel: string;
  sections: SummarySectionSpec[];
};

export type ScenarioDefinition = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Warm-up" | "Core" | "Advanced";
  persona: string;
  defaultConfig: Omit<SessionConfig, "scenarioId">;
  summaryTemplate?: SummaryTemplate;
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

export type SummaryMetric = {
  key: string;
  label: string;
  value: string;
  tone?: "positive" | "neutral" | "caution";
};

export type SummarySection =
  | {
      key: string;
      kind: "takeaway";
      title: string;
      text: string;
    }
  | {
      key: string;
      kind: "bullets";
      title: string;
      items: string[];
    }
  | {
      key: string;
      kind: "metrics";
      title: string;
      items: SummaryMetric[];
    }
  | {
      key: string;
      kind: "quote";
      title: string;
      text: string;
      speaker?: "you" | "partner";
    }
  | {
      key: string;
      kind: "transcript";
      title: string;
      previewTurns?: number;
    }
  | {
      key: string;
      kind: "job-coverage";
      title: string;
      coveredItems: string[];
      missingItems: string[];
      hireLikelihood?: string;
    }
  | {
      key: string;
      kind: "reflection";
      title: string;
      traits: string[];
      text: string;
    }
  | {
      key: string;
      kind: "rewrite";
      title: string;
      items: Array<{
        original: string;
        revised: string;
      }>;
    }
  | {
      key: string;
      kind: "question-review";
      title: string;
      items: Array<{
        question: string;
        level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
        feedback: string;
      }>;
    }
  | {
      key: string;
      kind: "study-topics";
      title: string;
      items: Array<{
        topic: string;
        reason: string;
      }>;
      proMessage?: string;
    };

export type SessionSummary = {
  scenarioId?: string;
  intro?: string;
  sections?: SummarySection[];
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
