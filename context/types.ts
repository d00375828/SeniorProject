export type Criteria = {
    clarity: boolean;
    empathy: boolean;
    conciseness: boolean;
    objectionHandling: boolean;
    productKnowledge: boolean;
  };
  
  export type AiDialogueLine = { speaker: "salesman" | "prospect"; text: string };
  export type AiReport = {
    transcriptionId: string;
    overallScore: number;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    summary: string;
    metrics: Record<string, number>;
    dialogue: AiDialogueLine[];
    serverTimestamp?: string;
    fileSizeBytes?: number;
  };
  
  export type RecordingInput = {
    transcript: string;
    notes: string;
    uri: string | null;
    createdAt: number;
    ai?: AiReport;
  };
  
  export type Grade = {
    id: number;
    createdAt: number;
    score: number;
    positives: string[];
    suggestions: string[];
  };
  
  export type NotifPrefs = { push: boolean; email: boolean; sms: boolean };
  
  export type AccessEntry = {
    name: string;
    role: string;
    relation: "manager" | "friend" | "owner";
  };
  
  export type PrivacyPrefs = {
    activeListening: boolean;
    analytics: boolean;
    location: boolean;
    microphone: boolean;
    access: AccessEntry[];
  };
  