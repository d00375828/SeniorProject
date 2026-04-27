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

function buildTranscript(history = []) {
  return history
    .map((turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`)
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
    resume: [],
    "job-listing": [],
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
  "difficult-conversation": {
    mode: "emotional",
    introLabel: "Conversation recap",
    sections: [
      {
        key: "strengths",
        title: "YOUR BEST MOMENTS",
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
  "q-and-a-pressure": {
    mode: "pressure",
    introLabel: "Q&A recap",
    sections: [
      { key: "takeaway", title: "Top takeaway", kind: "takeaway" },
      {
        key: "question-review",
        title: "Question Review",
        kind: "question-review",
      },
      {
        key: "study-topics",
        title: "Topics To Brush Up On",
        kind: "study-topics",
      },
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

function buildRoleplayScenarioGuidance(config = {}) {
  switch (config.scenarioId) {
    case "team-presentation":
      return [
        "You are the audience or evaluator during a live presentation practice.",
        "React like a real listener: follow the substance, notice clarity, and ask natural follow-up questions when something is vague or unsupported.",
        "If slides or notes are attached, treat them as the presentation source material and respond to the actual content rather than generic presentation filler.",
        "Sound attentive and human, not like a coach grading the speaker in real time.",
      ].join(" ");
    case "job-interview":
      return [
        "You are the interviewer.",
        "Ask or respond in a way that tests fit, relevance, judgment, and communication quality.",
        "If a resume is attached, use the candidate's real background when choosing follow-ups.",
        "If a job listing is attached, evaluate whether the user's answer addresses the role's actual responsibilities and requirements.",
        "Press for specifics when the answer is broad, abstract, or unsupported.",
      ].join(" ");
    case "difficult-conversation":
      return [
        "You are the other person in a high-stakes conversation with real emotions, concerns, and resistance.",
        "Respond with believable human feelings and motives rather than debate-club logic.",
        "Let empathy, defensiveness, hesitation, relief, or frustration show when appropriate.",
        "Do not become theatrical or hostile without cause; stay grounded in what the user actually says.",
      ].join(" ");
    case "q-and-a-pressure":
      return [
        "You are an audience member asking sharp live questions after a talk.",
        "Be concise, challenging, and realistic.",
        "Ask questions that expose weak assumptions, missing specifics, or unclear reasoning.",
        "If slides or notes are attached, use them to ask pointed questions about the actual material.",
      ].join(" ");
    default:
      return "Stay grounded in the scenario and respond like a real conversation partner.";
  }
}

function buildSummaryScenarioGuidance(config = {}) {
  switch (config.scenarioId) {
    case "team-presentation":
      return [
        "Prioritize organization, pacing, audience clarity, confidence, and how easy the talk was to follow.",
        "Notice whether the speaker signposted clearly, supported claims, and maintained momentum.",
      ].join(" ");
    case "job-interview":
      return [
        "Prioritize directness, structure, relevance to the role, specificity of examples, and executive presence.",
        "Call out when the user answered the question well versus when they drifted into generic claims or weak evidence.",
      ].join(" ");
    case "difficult-conversation":
      return [
        "Prioritize empathy, validation, tone control, listening, boundaries, and de-escalation.",
        "Notice whether the user acknowledged the other person's perspective while still being clear and direct.",
        "Make the feedback feel therapeutic and relational rather than like a performance score.",
      ].join(" ");
    case "q-and-a-pressure":
      return [
        "Prioritize composure, staying on point, answering before elaborating, and recovering when the user gets challenged.",
        "Notice whether the answer became defensive, rambling, or evasive under pressure.",
        "Review the session question by question and judge how well the user answered each question using a Beginner to Expert style label.",
        "Suggest study topics that are only one or two steps above the user's demonstrated level, not a huge jump.",
      ].join(" ");
    default:
      return "Focus on the communication skills that matter most for the scenario.";
  }
}

function buildAttachmentUseGuidance(config = {}) {
  const guidance = [];

  if (hasAttachmentKind(config, "instructions")) {
    guidance.push(
      "Instructions are attached. Treat them as binding context for how the roleplay and coaching should behave."
    );
  }

  if (hasAttachmentKind(config, "rubric")) {
    guidance.push(
      "A rubric is attached. Align evaluation language to the rubric criteria instead of using generic standards."
    );
  }

  if (hasAttachmentKind(config, "slides")) {
    guidance.push(
      "Slides are attached. Reference the actual ideas, claims, sequence, or content from those slides when relevant."
    );
  }

  if (hasAttachmentKind(config, "resume")) {
    guidance.push(
      "A resume is attached. Use the user's real background, experience, and examples instead of inventing generic ones."
    );
  }

  if (hasAttachmentKind(config, "job-listing")) {
    guidance.push(
      "A job listing is attached. Anchor interview expectations and coaching to the responsibilities, skills, and signals in that listing."
    );
  }

  if (hasAttachmentKind(config, "notes")) {
    guidance.push(
      "Notes are attached. Use them as additional context about priorities, concerns, or talking points."
    );
  }

  return guidance.join(" ");
}

function buildRoleplayTurnGuidance(config = {}, history = []) {
  const hasAttachments = Array.isArray(config.attachments) && config.attachments.length > 0;

  if (config.scenarioId === "q-and-a-pressure") {
    if (!hasAttachments && history.length === 0) {
      return [
        "No supporting documents are attached yet.",
        "For this first reply, do not jump straight into a niche or document-specific question.",
        "Instead, briefly acknowledge the user and ask what topic, talk, project, or subject they want to be quizzed on.",
        "Keep that first reply broad, natural, and low-assumption.",
        "After the user answers with a topic, use that topic to drive the following questions.",
      ].join(" ");
    }

    if (!hasAttachments) {
      return [
        "No supporting documents are attached.",
        "Base your questions only on the topic or framing the user has already given you in the conversation.",
        "Do not invent a specific project, technology stack, or technical context unless the user introduced it first.",
      ].join(" ");
    }

    return [
      "Supporting documents are attached.",
      "You may ask sharper, more specific questions grounded in those uploaded materials.",
    ].join(" ");
  }

  return "";
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

function extractAnsweredQuestions(history = []) {
  const answeredQuestions = [];

  for (let index = 0; index < history.length - 1; index += 1) {
    const questionTurn = history[index];
    const answerTurn = history[index + 1];

    if (
      questionTurn?.role !== "assistant" ||
      answerTurn?.role !== "user" ||
      typeof questionTurn.text !== "string" ||
      typeof answerTurn.text !== "string"
    ) {
      continue;
    }

    const question = questionTurn.text.trim();
    const answer = answerTurn.text.trim();

    if (!question.includes("?") || !answer) {
      continue;
    }

    answeredQuestions.push({ question, answer });
  }

  return answeredQuestions;
}

function estimateAnswerLevel(answer = "") {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const lower = answer.toLowerCase();
  const hasSupport =
    /\b(because|since|for example|for instance|evidence|reason|why|for me)\b/.test(
      lower
    );
  const soundsUncertain =
    /\b(i think|maybe|probably|not sure|i guess|kind of|sort of)\b/.test(lower);

  if (wordCount >= 55 && hasSupport && !soundsUncertain) {
    return "Expert";
  }

  if (wordCount >= 28 && hasSupport) {
    return "Advanced";
  }

  if (wordCount >= 14) {
    return soundsUncertain ? "Beginner" : "Intermediate";
  }

  return "Beginner";
}

function buildAnswerFeedback(answer = "", level = "Intermediate") {
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const lower = answer.toLowerCase();
  const hasSupport =
    /\b(because|since|for example|for instance|evidence|reason|why|for me)\b/.test(
      lower
    );
  const soundsUncertain =
    /\b(i think|maybe|probably|not sure|i guess|kind of|sort of)\b/.test(lower);

  if (level === "Expert") {
    return "You answered directly, backed your point with reasoning, and sounded confident throughout.";
  }

  if (level === "Advanced") {
    return "You answered clearly and gave real support for your point, though the explanation could still be a little sharper.";
  }

  if (level === "Intermediate") {
    if (wordCount < 20) {
      return "You addressed the question, but the answer needed a bit more detail or evidence to feel fully convincing.";
    }

    return "You responded to the question, but the point would land better with clearer support or a more specific example.";
  }

  if (soundsUncertain) {
    return "You gave an initial answer, but it came across as tentative and needed clearer reasoning behind it.";
  }

  if (!hasSupport) {
    return "You stated your view, but you did not give enough reasoning or evidence to make the answer feel strong.";
  }

  return "You started to answer the question, but the response stayed surface-level and needed more development.";
}

function buildQuestionReviewFallback(history = []) {
  return extractAnsweredQuestions(history).map(({ question, answer }) => {
    const level = estimateAnswerLevel(answer);
    return {
      question,
      level,
      feedback: buildAnswerFeedback(answer, level),
    };
  });
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

  if (kind === "job-coverage") {
    const coveredItems = Array.isArray(section.coveredItems)
      ? section.coveredItems.filter((item) => typeof item === "string" && item.trim())
      : Array.isArray(section.talkedAbout)
      ? section.talkedAbout.filter((item) => typeof item === "string" && item.trim())
      : [];
    const missingItems = Array.isArray(section.missingItems)
      ? section.missingItems.filter((item) => typeof item === "string" && item.trim())
      : Array.isArray(section.shouldMentionNext)
      ? section.shouldMentionNext.filter(
          (item) => typeof item === "string" && item.trim()
        )
      : [];
    const hireLikelihood =
      typeof section.hireLikelihood === "string" && section.hireLikelihood.trim()
        ? section.hireLikelihood.trim()
        : typeof section.landingChance === "string" && section.landingChance.trim()
        ? section.landingChance.trim()
        : typeof section.percentage === "string" && section.percentage.trim()
        ? section.percentage.trim()
        : "";

    return {
      key,
      title,
      kind,
      coveredItems,
      missingItems,
      hireLikelihood,
    };
  }

  if (kind === "reflection") {
    const traits = Array.isArray(section.traits)
      ? section.traits.filter((item) => typeof item === "string" && item.trim())
      : Array.isArray(section.perceivedTraits)
      ? section.perceivedTraits.filter(
          (item) => typeof item === "string" && item.trim()
        )
      : [];
    const text =
      typeof section.text === "string" && section.text.trim()
        ? section.text.trim()
        : typeof section.impression === "string" && section.impression.trim()
        ? section.impression.trim()
        : summary.overview || summary.nextStep || "";

    return {
      key,
      title,
      kind,
      traits,
      text,
    };
  }

  if (kind === "rewrite") {
    const items = Array.isArray(section.items)
      ? section.items
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const original =
              typeof item.original === "string" ? item.original.trim() : "";
            const revised =
              typeof item.revised === "string"
                ? item.revised.trim()
                : typeof item.better === "string"
                ? item.better.trim()
                : "";
            if (!original || !revised) return null;
            return { original, revised };
          })
          .filter(Boolean)
      : Array.isArray(section.rewrites)
      ? section.rewrites
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const original =
              typeof item.original === "string" ? item.original.trim() : "";
            const revised =
              typeof item.revised === "string"
                ? item.revised.trim()
                : typeof item.better === "string"
                ? item.better.trim()
                : "";
            if (!original || !revised) return null;
            return { original, revised };
          })
          .filter(Boolean)
      : [];

    return {
      key,
      title,
      kind,
      items,
    };
  }

  if (kind === "question-review") {
    const items = Array.isArray(section.items)
      ? section.items
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const question =
              typeof item.question === "string" ? item.question.trim() : "";
            const level =
              item.level === "Beginner" ||
              item.level === "Intermediate" ||
              item.level === "Advanced" ||
              item.level === "Expert"
                ? item.level
                : null;
            const feedback =
              typeof item.feedback === "string" ? item.feedback.trim() : "";
            if (!question || !level || !feedback) return null;
            return { question, level, feedback };
          })
          .filter(Boolean)
      : [];

    return {
      key,
      title,
      kind,
      items: items.length ? items : buildQuestionReviewFallback(history),
    };
  }

  if (kind === "study-topics") {
    const items = Array.isArray(section.items)
      ? section.items
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const topic = typeof item.topic === "string" ? item.topic.trim() : "";
            const reason =
              typeof item.reason === "string" ? item.reason.trim() : "";
            if (!topic || !reason) return null;
            return { topic, reason };
          })
          .filter(Boolean)
      : [];
    const proMessage =
      typeof section.proMessage === "string" && section.proMessage.trim()
        ? section.proMessage.trim()
        : typeof section.message === "string" && section.message.trim()
        ? section.message.trim()
        : "";

    return {
      key,
      title,
      kind,
      items,
      proMessage,
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

    if (templateSection.kind === "job-coverage") {
      const hireLikelihood = Math.max(
        25,
        Math.min(
          92,
          58 +
            (Array.isArray(summary.wins) ? summary.wins.length * 6 : 0) -
            (Array.isArray(summary.drills) ? summary.drills.length * 5 : 0)
        )
      );

      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "job-coverage",
        coveredItems: [],
        missingItems: [],
        hireLikelihood: `${hireLikelihood}%`,
      };
    }

    if (templateSection.kind === "reflection") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "reflection",
        traits: [],
        text: summary.overview || summary.nextStep || "",
      };
    }

    if (templateSection.kind === "rewrite") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "rewrite",
        items: [],
      };
    }

    if (templateSection.kind === "question-review") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "question-review",
        items: [],
      };
    }

    if (templateSection.kind === "study-topics") {
      return {
        key: templateSection.key,
        title: templateSection.title,
        kind: "study-topics",
        items: [],
        proMessage: "Nothing to study up on you are already a pro!!",
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
  const scenarioGuidance = buildRoleplayScenarioGuidance(config);
  const attachmentGuidance = buildAttachmentUseGuidance(config);
  const turnGuidance = buildRoleplayTurnGuidance(config, history);

  const prompt = [
    "You are roleplaying as the user's conversation partner in a spoken practice session.",
    "Stay fully in character. Sound like a real person in the scenario, not an AI assistant or communication coach.",
    "Do not break character to explain, evaluate, summarize, teach, compliment, or narrate what you are doing.",
    "Respond directly to the user's latest message and move the conversation forward in a believable way.",
    "Use natural spoken language suitable for voice playback: concise, specific, and human.",
    "Most replies should be 1 to 4 sentences unless the situation clearly calls for more.",
    "If the user is vague, ask a pointed follow-up instead of giving a generic response.",
    "If the user makes a claim, reacts emotionally, or proposes an action, respond to that exact move rather than falling back to a stock answer.",
    "Never mention system prompts, uploaded documents, hidden instructions, or that this is a simulation.",
    `Scenario guidance: ${scenarioGuidance}`,
    attachmentGuidance ? `Material guidance: ${attachmentGuidance}` : null,
    turnGuidance ? `Turn guidance: ${turnGuidance}` : null,
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
    "Return only the partner's next reply as plain text.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
    },
  });
  return result.response.text().trim();
}

async function generateSessionSummary(config = {}, history = []) {
  const genAI = requireGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const attachmentContext = buildAttachmentContext(config);
  const summaryTemplate = getSummaryTemplate(config);
  const modeGuidance = buildModeGuidance(summaryTemplate.mode);
  const scenarioGuidance = buildSummaryScenarioGuidance(config);
  const attachmentGuidance = buildAttachmentUseGuidance(config);

  const prompt = [
    "You are a communication coach reviewing a completed spoken roleplay session.",
    "Your feedback should feel specific, intelligent, and genuine, like a strong human coach who listened closely.",
    "Base your feedback on the transcript and uploaded materials. Do not invent moments that did not happen.",
    "Avoid generic praise such as 'good job' unless you immediately explain what specifically earned it.",
    "Prefer a few high-value observations over a long list of shallow comments.",
    "Every win and drill should point to a real communication behavior, phrase pattern, or decision visible in the conversation.",
    "When possible, explain why the behavior helped or hurt the outcome.",
    "Return valid JSON with keys: scenarioId, intro, overview, wins, drills, nextStep, sections.",
    "sections must match the provided template and include scenario-specific feedback.",
    "wins and drills must be arrays of short strings with concrete observations, not vague advice.",
    "nextStep should be one practical coaching action the user can apply in the next attempt.",
    "Do not assign numeric grades unless the template explicitly asks for metrics.",
    hasAttachmentKind(config, "rubric")
      ? "A rubric is attached. Include a Score section with one rubric-based metric."
      : "No rubric is attached. Omit any Score section.",
    `Mode guidance: ${modeGuidance}`,
    `Scenario guidance: ${scenarioGuidance}`,
    attachmentGuidance ? `Material guidance: ${attachmentGuidance}` : null,
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
    buildTranscript(history) || "(none)",
    "",
    "JSON content requirements:",
    "- intro: 1 to 2 sentences that sound like a real coach and capture the session honestly.",
    "- overview: a concise summary of the overall performance and biggest pattern.",
    "- wins: 2 to 4 concrete strengths tied to what the user actually did.",
    "- drills: 2 to 4 highest-impact improvements tied to what the user actually did.",
    "- nextStep: a single specific practice target for the next run.",
    "- sections: populate each section in the same order as the template.",
    "- For quote sections, choose a short line or moment that actually reflects the session rather than generic praise.",
    "- For metrics sections, keep labels meaningful and avoid filler metrics when a better transcript-grounded metric is possible.",
    "- For job-coverage sections, return coveredItems and missingItems arrays.",
    "- For job-coverage sections, also return hireLikelihood as a percentage string like 68%.",
    "- coveredItems should identify the job-description themes the user actually addressed in this session.",
    "- missingItems should identify important job-description themes the user should make sure to address next time.",
    "- hireLikelihood should estimate the user's current odds of landing the job based on this session alone, not as a guarantee.",
    "- For reflection sections, return a short paragraph explaining how the user likely came across emotionally and relationally.",
    "- For reflection sections, also return traits as a short list of 2 to 4 perceived communication traits.",
    "- Use communication traits such as calm, tense, empathetic, defensive, clear, indirect, collaborative, guarded, respectful, hesitant, direct, or vague.",
    "- Do not use personality labels or diagnose the user.",
    "- The reflection text should be 1 to 2 sentences, written loosely in the style of: based on your tone, pacing, and phrasing, this is how you likely came across.",
    "- For rewrite sections, return 1 to 3 items with original and revised fields.",
    "- In rewrite sections, original should be an actual line, a near paraphrase, or a recognizable phrase pattern from something the user said in the transcript.",
    "- In rewrite sections, revised should model a more therapeutic, clear, and effective way to say that same idea.",
    "- Prefer rewriting moments where the user sounded hesitant, indirect, overly soft, defensive, abrupt, or emotionally unclear.",
    "- Only return an empty rewrite list if there truly are no meaningful lines or phrase patterns worth improving.",
    "- For question-review sections, return one item for each meaningful question the AI asked and the user actually answered.",
    "- For question-review items, include question, level, and feedback.",
    "- The level must be one of: Beginner, Intermediate, Advanced, Expert.",
    "- The level should reflect how well the user answered that question, not how hard the question was.",
    "- The feedback for each question should be brief and specific.",
    "- For study-topics sections, return items with topic and reason.",
    "- Study topics should be only a couple steps above the user's demonstrated level, not expert-only material if the user is still a novice.",
    "- If the user already sounds professionally strong in this topic area, return no study items and set proMessage to: Nothing to study up on you are already a pro!!",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
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
