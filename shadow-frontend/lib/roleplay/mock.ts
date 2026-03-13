import { SessionConfig, SessionSummary, SessionTurn, TurnResponse } from "@/context";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lastUserTurn(history: SessionTurn[]) {
  const turns = history.filter((turn) => turn.role === "user");
  return turns[turns.length - 1];
}

export async function mockSubmitTurn(
  config: SessionConfig,
  history: SessionTurn[]
): Promise<TurnResponse> {
  await wait(900);
  const turnNumber = Math.floor(history.length / 2) + 1;
  const previousUser = lastUserTurn(history)?.text;

  const userTranscript =
    turnNumber === 1
      ? `Hi, I'm practicing as a ${config.userRole}. My goal is to ${config.objective.toLowerCase()}.`
      : `Thanks, that helps. Let me respond while keeping a ${config.partnerStyle.toLowerCase()} context in mind.`;

  const assistantText = previousUser
    ? `That answer was steady. Push it one step further: make it more specific, slow your pacing, and respond directly to the emotional pressure in the room.`
    : `Good start. Now raise the pressure a little and answer as if your listener needs clarity, confidence, and a reason to trust what you're saying.`;

  return {
    userTranscript,
    assistantText,
    assistantAudioUri: null,
  };
}

export async function mockEndSession(
  config: SessionConfig,
  turns: SessionTurn[]
): Promise<SessionSummary> {
  await wait(900);

  const transcript = turns
    .map((turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`)
    .join("\n");

  return {
    transcript,
    overview: `This practice session stayed aligned to your objective and gave you useful repetition under realistic speaking pressure.`,
    wins: [
      "You stayed engaged instead of rushing to fill silence.",
      "Your delivery showed moments of real clarity and control.",
      "You kept the session anchored to a concrete communication goal.",
    ],
    drills: [
      "Slow down the first sentence of each answer and let key ideas land.",
      "Use one more concrete example or supporting detail.",
      "End with a cleaner, more confident closing statement.",
    ],
    nextStep:
      "Run the scenario again and focus on calmer pacing, clearer structure, and stronger vocal confidence.",
  };
}
