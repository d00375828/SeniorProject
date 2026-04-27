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

function hasAttachmentKind(config = {}, kind) {
  const attachments = Array.isArray(config.attachments) ? config.attachments : [];
  return attachments.some((attachment) => attachment?.kind === kind);
}

const DEFAULT_SUMMARY_TEMPLATE = {
  mode: "objective",
  introLabel: "Session recap",
  sections: [
    { key: "takeaway", title: "Top takeaway", kind: "takeaway" },
    { key: "strengths", title: "What went well", kind: "bullets" },
    { key: "metrics", title: "Session signals", kind: "metrics" },
    { key: "focus", title: "What to sharpen", kind: "bullets" },
    { key: "transcript", title: "Transcript", kind: "transcript" },
  ],
};

const SUMMARY_TEMPLATES = {
  "team-presentation": {
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
  "job-interview": {
    mode: "objective",
    introLabel: "Interview recap",
    sections: [
      { key: "takeaway", title: "Top takeaway", kind: "takeaway" },
      { key: "strengths", title: "What worked", kind: "bullets" },
      { key: "metrics", title: "Interview signals", kind: "metrics" },
      { key: "focus", title: "What to sharpen", kind: "bullets" },
      { key: "transcript", title: "Transcript", kind: "transcript" },
    ],
  },
  "difficult-conversation": {
    mode: "emotional",
    introLabel: "Conversation recap",
    sections: [
      { key: "takeaway", title: "Top takeaway", kind: "takeaway" },
      { key: "quote", title: "Best moment", kind: "quote" },
      { key: "strengths", title: "What went well", kind: "bullets" },
      { key: "focus", title: "What to try next", kind: "bullets" },
      { key: "transcript", title: "Transcript", kind: "transcript" },
    ],
  },
  "q-and-a-pressure": {
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
};

function getSummaryTemplate(config = {}) {
  const provided = config.summaryTemplate;
  const template =
    provided &&
    typeof provided === "object" &&
    typeof provided.mode === "string" &&
    typeof provided.introLabel === "string" &&
    Array.isArray(provided.sections) &&
    provided.sections.length
      ? provided
      : SUMMARY_TEMPLATES[config.scenarioId] || DEFAULT_SUMMARY_TEMPLATE;

  return {
    ...template,
    sections: template.sections.filter((section) => {
      if (!section.requiresAttachmentKind) {
        return true;
      }
      return hasAttachmentKind(config, section.requiresAttachmentKind);
    }),
  };
}

function describeSummaryTemplate(template) {
  const sections = template.sections
    .map((section) => {
      const maxItems = typeof section.maxItems === "number" ? `, maxItems=${section.maxItems}` : "";
      const requirement = section.requiresAttachmentKind
        ? `, requires=${section.requiresAttachmentKind}`
        : "";
      return `- ${section.key}: ${section.title} (${section.kind}${maxItems}${requirement})`;
    })
    .join("\n");

  return [
    `Summary mode: ${template.mode}`,
    `Intro label: ${template.introLabel}`,
    "Section requirements:",
    sections,
  ].join("\n");
}

function buildModeGuidance(mode) {
  switch (mode) {
    case "objective":
      return [
        "Focus on answer structure, clarity, concision, and use of concrete examples.",
        "Avoid emotional or relational framing unless it directly affects the response quality.",
        "Prefer direct, measurable feedback over vague praise.",
      ].join(" ");
    case "emotional":
      return [
        "Focus on empathy, validation, tone, listening, and whether tension was reduced or escalated.",
        "Highlight relational skill and emotional awareness over numeric-style grading.",
        "Use coach-like language that feels human and specific.",
      ].join(" ");
    case "delivery":
      return [
        "Focus on pacing, organization, confidence, transitions, and audience engagement.",
        "Call out the strongest delivery moments and where the structure was easiest to follow.",
        "Keep feedback practical and presentation-oriented.",
        "If a rubric is attached, include a rubric-based Score section and omit it when no rubric is present.",
      ].join(" ");
    case "pressure":
      return [
        "Focus on composure, staying on point, recovery under pressure, and how clearly the answer landed.",
        "Highlight calmness and response quality when the question was difficult or unexpected.",
        "Keep the coaching grounded and specific.",
      ].join(" ");
    default:
      return "Keep the feedback specific, coach-like, and grounded in the session.";
  }
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

function normalizeSummarySection(section, templateSection, summary, history) {
  if (!section || typeof section !== "object") {
    section = {};
  }

  const key = typeof section.key === "string" && section.key.trim()
    ? section.key
    : templateSection.key;
  const title = typeof section.title === "string" && section.title.trim()
    ? section.title
    : templateSection.title;
  const kind = templateSection.kind;

  if (kind === "takeaway") {
    const text =
      typeof section.text === "string" && section.text.trim()
        ? section.text.trim()
        : summary.overview || summary.nextStep || "";
    return { key, title, kind, text };
  }

  if (kind === "bullets") {
    const items = Array.isArray(section.items)
      ? section.items.filter((item) => typeof item === "string" && item.trim())
      : [];
    return {
      key,
      title,
      kind,
      items: items.length
        ? items
        : templateSection.key.toLowerCase().includes("focus")
        ? summary.drills
        : summary.wins,
    };
  }

  if (kind === "metrics") {
    const items = Array.isArray(section.items)
      ? section.items
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const label = typeof item.label === "string" ? item.label.trim() : "";
            const value = typeof item.value === "string" ? item.value.trim() : "";
            if (!label || !value) return null;
            return {
              key: typeof item.key === "string" && item.key.trim() ? item.key : `${key}-${index}`,
              label,
              value,
              tone:
                item.tone === "positive" || item.tone === "neutral" || item.tone === "caution"
                  ? item.tone
                  : undefined,
            };
          })
          .filter(Boolean)
      : [];

    if (items.length) {
      return { key, title, kind, items };
    }

    if (templateSection.key === "score" || templateSection.title === "Score") {
      const score = Math.max(
        40,
        Math.min(
          100,
          70 + (Array.isArray(summary.wins) ? summary.wins.length * 5 : 0) -
            (Array.isArray(summary.drills) ? summary.drills.length * 4 : 0)
        )
      );
      return {
        key,
        title,
        kind,
        items: [
          {
            key: `${key}-overall`,
            label: "Rubric score",
            value: `${score}/100`,
            tone: "positive",
          },
        ],
      };
    }

    return {
      key,
      title,
      kind,
      items: [
        { key: `${key}-turns`, label: "Turns", value: String(history.length), tone: "neutral" },
        {
          key: `${key}-wins`,
          label: "Wins",
          value: String(summary.wins.length),
          tone: "positive",
        },
      ],
    };
  }

  if (kind === "quote") {
    return {
      key,
      title,
      kind,
      text:
        typeof section.text === "string" && section.text.trim()
          ? section.text.trim()
          : summary.wins[0] || summary.overview || "",
      speaker: section.speaker === "you" || section.speaker === "partner" ? section.speaker : undefined,
    };
  }

  return {
    key,
    title,
    kind: "transcript",
    previewTurns:
      typeof section.previewTurns === "number" && section.previewTurns > 0
        ? Math.floor(section.previewTurns)
        : 3,
  };
}

function buildFallbackSections(template, summary, history) {
  return template.sections.map((templateSection) => {
    if (templateSection.kind === "takeaway") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "takeaway",
        text: summary.overview || summary.nextStep || "",
      };
    }

    if (templateSection.kind === "bullets") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "bullets",
        items: templateSection.key.toLowerCase().includes("focus")
          ? summary.drills
          : summary.wins,
      };
    }

    if (templateSection.kind === "metrics") {
      if (templateSection.key === "score" || templateSection.title === "Score") {
        const score = Math.max(
          40,
          Math.min(
            100,
            70 + (Array.isArray(summary.wins) ? summary.wins.length * 5 : 0) -
              (Array.isArray(summary.drills) ? summary.drills.length * 4 : 0)
          )
        );
        return {
          key: templateSection.key,
          title: templateSection.title,
          kind: "metrics",
          items: [
            {
              key: `${templateSection.key}-overall`,
              label: "Rubric score",
              value: `${score}/100`,
              tone: "positive",
            },
          ],
        };
      }

      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "metrics",
        items: [
          { key: `${templateSection.key}-turns`, label: "Turns", value: String(history.length), tone: "neutral" },
          { key: `${templateSection.key}-wins`, label: "Wins", value: String(summary.wins.length), tone: "positive" },
        ],
      };
    }

    if (templateSection.kind === "quote") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "quote",
        text: summary.wins[0] || summary.overview || "",
        speaker: "you",
      };
    }

    return {
      key: templateSection.key,
      title: templateSection.title,
      kind: "transcript",
      previewTurns: templateSection.maxItems || 3,
    };
  });
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
  const summaryTemplate = getSummaryTemplate(config);
  const modeGuidance = buildModeGuidance(summaryTemplate.mode);

  const prompt = [
    "You are a communication coach reviewing a completed spoken roleplay session.",
    "Return valid JSON with keys: scenarioId, intro, overview, wins, drills, nextStep, sections.",
    "sections must match the provided template and include helpful, scenario-specific feedback.",
    "wins and drills must be arrays of short strings.",
    "Use uploaded rubrics, instructions, slides, and notes when they are present.",
    "If a rubric or instructions are provided, align the feedback to them instead of giving generic advice.",
    "Do not assign numeric grades unless the template explicitly asks for metrics.",
    hasAttachmentKind(config, "rubric")
      ? "A rubric is attached. Include a Score section with one rubric-based metric."
      : "No rubric is attached. Omit any Score section.",
    `Mode guidance: ${modeGuidance}`,
    `Template intro label: ${summaryTemplate.introLabel}`,
    describeSummaryTemplate(summaryTemplate),
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
  const summary = {
    scenarioId:
      typeof parsed.scenarioId === "string" && parsed.scenarioId.trim()
        ? parsed.scenarioId
        : config.scenarioId || "",
    intro: typeof parsed.intro === "string" ? parsed.intro : "",
    overview: typeof parsed.overview === "string" ? parsed.overview : "",
    wins: Array.isArray(parsed.wins) ? parsed.wins.filter(Boolean) : [],
    drills: Array.isArray(parsed.drills) ? parsed.drills.filter(Boolean) : [],
    nextStep: typeof parsed.nextStep === "string" ? parsed.nextStep : "",
  };
  const sections = Array.isArray(parsed.sections)
    ? summaryTemplate.sections.map((templateSection, index) =>
        normalizeSummarySection(parsed.sections[index], templateSection, summary, history)
      )
    : buildFallbackSections(summaryTemplate, summary, history);

  return {
    ...summary,
    intro: summary.intro || summary.overview || "",
    overview: summary.overview || summary.intro || "",
    sections,
  };
}

module.exports = {
  generateRoleplayReply,
  generateSessionSummary,
};
