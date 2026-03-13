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
  },
  {
    id: "difficult-conversation",
    title: "Difficult Conversation",
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
  },
];

export function getScenarioById(id: string) {
  return SCENARIOS.find((scenario) => scenario.id === id);
}
