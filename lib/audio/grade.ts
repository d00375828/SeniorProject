// lib/audio/grade.ts

export type AiDialogueLine = { speaker: "salesman" | "prospect"; text: string };

export type AiReport = {
  transcriptionId: string;
  overallScore: number;                 // grading.overall_score
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  summary: string;
  metrics: Record<string, number>;      // e.g. "Introduction Quality": 7.0
  dialogue: AiDialogueLine[];
  serverTimestamp?: string;
  fileSizeBytes?: number;
};

export type GradeResult = {
  ai: AiReport;
  transcript: string; // pretty, derived from dialogue
};

export function normalizeServerGrade(data: any): GradeResult {
  const dialogueArr = Array.isArray(data?.dialogue) ? data.dialogue : [];

  const dialogue: AiDialogueLine[] = dialogueArr.map((d: any) => ({
    speaker: d?.speaker === "prospect" ? "prospect" : "salesman",
    text: String(d?.text ?? ""),
  }));

  const transcript = dialogue
    .map((d) => `${d.speaker === "prospect" ? "Prospect" : "Sales"}: ${d.text}`)
    .join("\n")
    .trim();

  const ai: AiReport = {
    transcriptionId: String(data?.transcription_id ?? ""),
    overallScore: Number(data?.grading?.overall_score ?? 0),
    strengths: Array.isArray(data?.grading?.strengths) ? data.grading.strengths : [],
    areasForImprovement: Array.isArray(data?.grading?.areas_for_improvement)
      ? data.grading.areas_for_improvement
      : [],
    recommendations: Array.isArray(data?.grading?.recommendations) ? data.grading.recommendations : [],
    summary: String(data?.grading?.summary ?? ""),
    metrics: (data?.grading?.metrics && typeof data.grading.metrics === "object")
      ? data.grading.metrics
      : {},
    dialogue,
    serverTimestamp: data?.timestamp ? String(data.timestamp) : undefined,
    fileSizeBytes: Number.isFinite(Number(data?.file_size_bytes))
      ? Number(data.file_size_bytes)
      : undefined,
  };

  return { ai, transcript };
}

/** The canonical metric order you showed in your example */
export const ORDERED_METRIC_LABELS = [
  "Introduction Quality",
  "Discovery Questions Asked",
  "Listening Skills",
  "Value Proposition Clarity",
  "Objection Handling",
  "Closing Quality",
  "Talk Time Ratio",
  "Urgency Creation",
  "Professional Language",
  "Conversation Control",
] as const;
