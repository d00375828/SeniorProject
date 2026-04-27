import { ScenarioDefinition } from "@/context";

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "team-presentation",
    title: "Public Speaking",
    description:
      "Practice delivering a short presentation clearly and confidently to a small audience with light pressure.",
    category: "Presentation",
    difficulty: "Warm-up",
    persona: "A small audience expecting a clear, confident message",
    defaultConfig: {
      userRole: "Presenter",
      objective: "Deliver a clear, confident opening and keep steady pacing",
      partnerStyle: "Supportive but attentive audience",
    },
    summaryTemplate: {
      mode: "delivery",
      introLabel: "Presentation recap",
      sections: [
        {
          key: "score",
          title: "Score",
          kind: "metrics",
          requiresAttachmentKind: "rubric",
        },
        { key: "strengths", title: "What landed well", kind: "bullets" },
        { key: "focus", title: "What to sharpen", kind: "bullets" },
        { key: "transcript", title: "Transcript", kind: "transcript" },
      ],
    },
  },
  {
    id: "job-interview",
    title: "Job Interview",
    description:
      "Rehearse answering interview questions with concise examples, calm delivery, and stronger confidence.",
    category: "Interview",
    difficulty: "Core",
    persona: "A hiring manager evaluating clarity, confidence, and relevance",
    defaultConfig: {
      userRole: "Candidate",
      objective: "Answer clearly, use strong examples, and stay composed under pressure",
      partnerStyle: "Professional interviewer with follow-up questions",
    },
    summaryTemplate: {
      mode: "objective",
      introLabel: "Interview recap",
      sections: [
        { key: "strengths", title: "What worked", kind: "bullets" },
        { key: "focus", title: "What to sharpen", kind: "bullets" },
        {
          key: "job-coverage",
          title: "Job Description Coverage",
          kind: "job-coverage",
          requiresAttachmentKind: "job-listing",
        },
        { key: "transcript", title: "Transcript", kind: "transcript" },
      ],
    },
  },
  {
    id: "difficult-conversation",
    title: "Crucial Conversation",
    description:
      "Practice a high-stakes personal or professional conversation where tone, empathy, and boundaries matter.",
    category: "Conversation",
    difficulty: "Advanced",
    persona: "A conversation partner with emotions, concerns, and resistance",
    defaultConfig: {
      userRole: "Speaker",
      objective: "Stay calm, listen well, and communicate your point directly without escalating tension",
      partnerStyle: "Emotionally charged but open to honest dialogue",
    },
    summaryTemplate: {
      mode: "emotional",
      introLabel: "Conversation recap",
      sections: [
        { key: "quote", title: "Best moment", kind: "quote" },
        {
          key: "strengths",
          title: "What helped the conversation",
          kind: "bullets",
        },
        {
          key: "impression",
          title: "How you likely came across",
          kind: "reflection",
        },
        {
          key: "rewrite",
          title: "A better way to say it",
          kind: "rewrite",
        },
        { key: "transcript", title: "Transcript", kind: "transcript" },
      ],
    },
  },
  {
    id: "q-and-a-pressure",
    title: "Live Q&A",
    description:
      "Practice staying grounded when answering unexpected questions after a talk or presentation.",
    category: "Confidence",
    difficulty: "Core",
    persona: "An audience member asking sharp, unscripted questions",
    defaultConfig: {
      userRole: "Speaker",
      objective: "Respond calmly, think out loud clearly, and recover quickly from pressure",
      partnerStyle: "Curious but challenging questioner",
    },
    summaryTemplate: {
      mode: "pressure",
      introLabel: "Q&A recap",
      sections: [
        { key: "takeaway", title: "Top takeaway", kind: "takeaway" },
        { key: "strengths", title: "What held up well", kind: "bullets" },
        { key: "metrics", title: "Pressure signals", kind: "metrics" },
        { key: "focus", title: "What to tighten up", kind: "bullets" },
        { key: "transcript", title: "Transcript", kind: "transcript" },
      ],
    },
  },
];

export function getScenarioById(id: string) {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
