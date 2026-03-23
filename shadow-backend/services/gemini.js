const { GoogleGenerativeAI } = require("@google/generative-ai");

function requireGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY.");
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

function buildHistory(history = []) {
  return history
    .map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.text}`)
    .join("\n");
}

function buildAttachmentContext(config = {}) {
  const attachments = Array.isArray(config.attachments) ? config.attachments : [];
  if (!attachments.length) {
    return "";
  }

  const grouped = {
    slides: [],
    instructions: [],
    rubric: [],
    notes: [],
  };

  for (const attachment of attachments) {
    if (!attachment?.promptText || !grouped[attachment.kind]) {
      continue;
    }

    grouped[attachment.kind].push(
      `${attachment.name || "Untitled"}:\n${attachment.promptText}`
    );
  }

  const sections = Object.entries(grouped)
    .filter(([, items]) => items.length)
    .map(([kind, items]) => `${kind.toUpperCase()}:\n${items.join("\n\n")}`);

  if (!sections.length) {
    return "";
  }

  return ["Uploaded context documents:", ...sections].join("\n\n");
}

function parseJsonBlock(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Gemini returned non-JSON summary output.");
    }
    return JSON.parse(match[0]);
  }
}

async function generateRoleplayReply(config = {}, history = [], userTranscript = "") {
  const genAI = requireGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const attachmentContext = buildAttachmentContext(config);

  const prompt = [
    "You are roleplaying as the user's conversation partner.",
    "Stay in character, respond naturally, and keep the reply concise enough for voice playback.",
    "Use any uploaded context documents to stay grounded in the user's topic, requirements, and supporting materials.",
    `Scenario ID: ${config.scenarioId || "unknown"}`,
    `User role: ${config.userRole || "unknown"}`,
    `Objective: ${config.objective || "unknown"}`,
    `Partner style: ${config.partnerStyle || "unknown"}`,
    "",
    attachmentContext,
    attachmentContext ? "" : null,
    "Conversation so far:",
    buildHistory(history) || "(none)",
    "",
    `Latest user message: ${userTranscript}`,
    "",
    "Return only the assistant's next reply as plain text.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function generateSessionSummary(config = {}, history = []) {
  const genAI = requireGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const attachmentContext = buildAttachmentContext(config);

  const prompt = [
    "You are a communication coach reviewing a completed spoken roleplay session.",
    "Return valid JSON with keys: overview, wins, drills, nextStep.",
    "wins and drills must be arrays of short strings.",
    "Use uploaded rubrics, instructions, slides, and notes when they are present.",
    "If a rubric or instructions are provided, align the feedback to them instead of giving generic advice.",
    `Scenario ID: ${config.scenarioId || "unknown"}`,
    `User role: ${config.userRole || "unknown"}`,
    `Objective: ${config.objective || "unknown"}`,
    `Partner style: ${config.partnerStyle || "unknown"}`,
    "",
    attachmentContext,
    attachmentContext ? "" : null,
    "Conversation transcript:",
    buildHistory(history) || "(none)",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJsonBlock(result.response.text());

  return {
    overview: typeof parsed.overview === "string" ? parsed.overview : "",
    wins: Array.isArray(parsed.wins) ? parsed.wins.filter(Boolean) : [],
    drills: Array.isArray(parsed.drills) ? parsed.drills.filter(Boolean) : [],
    nextStep: typeof parsed.nextStep === "string" ? parsed.nextStep : "",
  };
}

module.exports = {
  generateRoleplayReply,
  generateSessionSummary,
};
