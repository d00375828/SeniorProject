import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import {
  useSession,
  useTheme,
  type SummaryMetric,
  type SummarySection,
  type SummarySectionSpec,
} from "@/context";

function excerpt(text: string, maxWords = 18) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(" ")}...`;
}

function speakerLabel(role: "user" | "assistant") {
  return role === "user" ? "You" : "Partner";
}

function snippet(text: string, maxWords = 12) {
  return excerpt(text.replace(/\s+/g, " ").trim(), maxWords).replace(
    /[.!?]+$/,
    ""
  );
}

function coachFragment(text: string, maxWords = 12) {
  const cleaned = snippet(text, maxWords);
  const lowered = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);

  const verbMap: Array<[RegExp, string]> = [
    [/^opened\b/i, "opening"],
    [/^asked\b/i, "asking"],
    [/^showed\b/i, "showing"],
    [/^used\b/i, "using"],
    [/^kept\b/i, "keeping"],
    [/^stayed\b/i, "staying"],
    [/^listened\b/i, "listening"],
    [/^handled\b/i, "handling"],
    [/^led\b/i, "leading"],
    [/^responded\b/i, "responding"],
  ];

  for (const [pattern, replacement] of verbMap) {
    if (pattern.test(lowered)) {
      return lowered.replace(pattern, replacement);
    }
  }

  return lowered;
}

function coachTakeaway(wins: string[]) {
  const highlights = wins
    .slice(0, 2)
    .map((item) => coachFragment(item, 12))
    .filter(Boolean);

  if (highlights.length === 0) {
    return "You handled the conversation well and stayed composed throughout.";
  }

  if (highlights.length === 1) {
    return `You handled this well by ${highlights[0]}.`;
  }

  return `You handled this well by ${highlights[0]} and ${highlights[1]}.`;
}

function defaultSummarySections(
  wins: string[],
  drills: string[],
  templateSections: SummarySectionSpec[],
  attachments: { kind: string }[]
): SummarySection[] {
  if (!templateSections.length) {
    return [
      {
        key: "takeaway",
        kind: "takeaway",
        title: "Top takeaway",
        text: coachTakeaway(wins),
      },
      {
        key: "strengths",
        kind: "bullets",
        title: "What went well",
        items: wins,
      },
      {
        key: "focus",
        kind: "bullets",
        title: "What to sharpen",
        items: drills,
      },
      {
        key: "transcript",
        kind: "transcript",
        title: "Transcript",
        previewTurns: 3,
      },
    ];
  }

  return templateSections
    .filter((section) => {
      if (!section.requiresAttachmentKind) return true;
      return hasAttachmentKind(attachments, section.requiresAttachmentKind);
    })
    .map((section) => {
      if (section.kind === "takeaway") {
        return {
          key: section.key,
          kind: "takeaway",
          title: section.title,
          text: coachTakeaway(wins),
        };
      }

      if (section.kind === "bullets") {
        return {
          key: section.key,
          kind: "bullets",
          title: section.title,
          items: section.key.toLowerCase().includes("focus") ? drills : wins,
        };
      }

      if (section.kind === "metrics") {
        const items: SummaryMetric[] = [
          {
            key: `${section.key}-wins`,
            label: "Wins",
            value: String(wins.length),
            tone: "positive",
          },
          {
            key: `${section.key}-drills`,
            label: "Focus items",
            value: String(drills.length),
            tone: "neutral",
          },
        ];

        return {
          key: section.key,
          kind: "metrics",
          title: section.title,
          items,
        };
      }

      if (section.kind === "quote") {
        return {
          key: section.key,
          kind: "quote",
          title: section.title,
          text: wins[0] ? coachFragment(wins[0], 16) : coachTakeaway(wins),
          speaker: "you",
        };
      }

      if (section.kind === "job-coverage") {
        const hireLikelihood = Math.max(
          25,
          Math.min(92, 58 + wins.length * 6 - drills.length * 5)
        );

        return {
          key: section.key,
          kind: "job-coverage",
          title: section.title,
          coveredItems: [],
          missingItems: [],
          hireLikelihood: `${hireLikelihood}%`,
        };
      }

      if (section.kind === "reflection") {
        return {
          key: section.key,
          kind: "reflection",
          title: section.title,
          traits: [],
          text: coachTakeaway(wins),
        };
      }

      if (section.kind === "rewrite") {
        return {
          key: section.key,
          kind: "rewrite",
          title: section.title,
          items: [],
        };
      }

      return {
        key: section.key,
        kind: "transcript",
        title: section.title,
        previewTurns: section.maxItems ?? 3,
      };
    });
}

function metricCardTone(tone?: SummaryMetric["tone"]) {
  if (tone === "caution") return "#D28C3C";
  if (tone === "neutral") return "#8F9AA7";
  return "#25b8a6";
}

function hasAttachmentKind(attachments: { kind: string }[], kind: string) {
  return attachments.some((attachment) => attachment.kind === kind);
}

export default function SummaryScreen() {
  const { colors } = useTheme();
  const {
    activeSession,
    currentSummary,
    saveCurrentSummary,
    clearCurrentFlow,
  } = useSession();
  const [materialsExpanded, setMaterialsExpanded] = useState(false);
  const [expandedTranscriptKey, setExpandedTranscriptKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!activeSession || !currentSummary) {
      router.replace("/");
    }
  }, [activeSession, currentSummary]);

  const analysis = useMemo(() => {
    const turns = activeSession?.turns ?? [];
    const transcript =
      currentSummary?.transcript ||
      turns
        .map(
          (turn) => `${turn.role === "user" ? "You" : "Partner"}: ${turn.text}`
        )
        .join("\n") ||
      "";

    return {
      transcript,
      turns,
    };
  }, [
    activeSession?.turns,
    currentSummary?.drills,
    currentSummary?.transcript,
  ]);

  if (!activeSession || !currentSummary) {
    return null;
  }

  const materials = activeSession.config.attachments ?? [];
  const templateSections =
    activeSession.scenario.summaryTemplate?.sections ?? [];
  const summarySections = currentSummary.sections?.length
    ? currentSummary.sections.filter((section) => {
        const spec = templateSections.find((item) => item.key === section.key);
        if (!spec?.requiresAttachmentKind) return true;
        return hasAttachmentKind(materials, spec.requiresAttachmentKind);
      }).map((section) => {
        if (
          activeSession.scenario.id === "difficult-conversation" &&
          section.kind === "transcript"
        ) {
          if (section.key === "impression") {
            return {
              key: section.key,
              kind: "reflection" as const,
              title: section.title,
              traits: [],
              text: currentSummary.overview || coachTakeaway(currentSummary.wins),
            };
          }

          if (section.key === "rewrite") {
            return {
              key: section.key,
              kind: "rewrite" as const,
              title: section.title,
              items: [],
            };
          }
        }

        return section;
      })
    : defaultSummarySections(
        currentSummary.wins,
        currentSummary.drills,
        templateSections,
        materials
      );
  const recapText = currentSummary.intro || coachTakeaway(currentSummary.wins);

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Summary" left={<BackButton />} />

      <Card style={{ gap: 16 }}>
        <View style={{ gap: 10 }}>
          <Text
            style={{
              color: colors.muted,
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Session Recap
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.fg, fontSize: 26, fontWeight: "900" }}>
              {activeSession.scenario.title}
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 22, fontSize: 15 }}>
              {recapText}
            </Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
            {activeSession.config.userRole} •{" "}
            {activeSession.config.partnerStyle}
            {materials.length
              ? ` • ${materials.length} material${
                  materials.length === 1 ? "" : "s"
                }`
              : ""}
          </Text>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            opacity: 0.8,
          }}
        />
      </Card>

      <View style={{ gap: 14 }}>
        {summarySections.map((section) => {
          if (section.kind === "takeaway") {
            return (
              <Card key={section.key} style={{ gap: 10 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                <Text
                  style={{ color: colors.fg, lineHeight: 24, fontSize: 16 }}
                >
                  {section.text}
                </Text>
              </Card>
            );
          }

          if (section.kind === "bullets") {
            return (
              <Card key={section.key} style={{ gap: 12 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                {section.items.length ? (
                  <View style={{ gap: 10 }}>
                    {section.items.map((item) => (
                      <Card
                        key={item}
                        bg={colors.box}
                        border={colors.border}
                        style={{ gap: 6, padding: 12 }}
                      >
                        <Text
                          style={{
                            color: colors.accent,
                            fontSize: 11,
                            fontWeight: "800",
                          }}
                        >
                          Bullet
                        </Text>
                        <Text style={{ color: colors.fg, lineHeight: 22 }}>
                          {item}
                        </Text>
                      </Card>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.muted, lineHeight: 22 }}>
                    No items available.
                  </Text>
                )}
              </Card>
            );
          }

          if (section.kind === "metrics") {
            if (
              section.title.toLowerCase() === "score" &&
              section.items.length === 1
            ) {
              const metric = section.items[0];
              return (
                <Card key={section.key} style={{ gap: 10 }}>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      fontWeight: "800",
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {section.title}
                  </Text>
                  <Card
                    bg={colors.box}
                    border={colors.border}
                    style={{ gap: 8, padding: 14 }}
                  >
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {metric.label}
                    </Text>
                    <Text
                      style={{
                        color: colors.fg,
                        fontSize: 32,
                        fontWeight: "900",
                      }}
                    >
                      {metric.value}
                    </Text>
                    {metric.tone ? (
                      <Text
                        style={{
                          color: metricCardTone(metric.tone),
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {metric.tone}
                      </Text>
                    ) : null}
                  </Card>
                </Card>
              );
            }

            return (
              <Card key={section.key} style={{ gap: 12 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {section.items.map((metric) => (
                    <Card
                      key={metric.key}
                      bg={colors.box}
                      border={colors.border}
                      style={{ flex: 1, minWidth: 130, gap: 6, padding: 12 }}
                    >
                      <Text
                        style={{
                          color: colors.muted,
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        {metric.label}
                      </Text>
                      <Text
                        style={{
                          color: colors.fg,
                          fontSize: 22,
                          fontWeight: "900",
                        }}
                      >
                        {metric.value}
                      </Text>
                      <Text
                        style={{
                          color: metricCardTone(metric.tone),
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {metric.tone ?? "neutral"}
                      </Text>
                    </Card>
                  ))}
                </View>
              </Card>
            );
          }

          if (section.kind === "quote") {
            return (
              <Card key={section.key} style={{ gap: 10 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                <View
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: colors.accent,
                    paddingLeft: 12,
                    gap: 6,
                  }}
                >
                  {section.speaker ? (
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 11,
                        fontWeight: "800",
                      }}
                    >
                      {section.speaker === "you" ? "You" : "Partner"}
                    </Text>
                  ) : null}
                  <Text
                    style={{ color: colors.fg, lineHeight: 24, fontSize: 16 }}
                  >
                    {section.text}
                  </Text>
                </View>
              </Card>
            );
          }

          if (section.kind === "job-coverage") {
            return (
              <Card key={section.key} style={{ gap: 14 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>

                {section.hireLikelihood ? (
                  <Card
                    bg={colors.box}
                    border={colors.border}
                    style={{ gap: 8, padding: 14 }}
                  >
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      Likelihood To Land The Job
                    </Text>
                    <Text
                      style={{
                        color: colors.fg,
                        fontSize: 32,
                        fontWeight: "900",
                      }}
                    >
                      {section.hireLikelihood}
                    </Text>
                    <Text style={{ color: colors.muted, lineHeight: 20 }}>
                      Estimated from this session's interview performance and
                      alignment to the uploaded job description.
                    </Text>
                  </Card>
                ) : null}

                <View style={{ gap: 10 }}>
                  <Text
                    style={{
                      color: colors.fg,
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    Key spots you covered
                  </Text>
                  {section.coveredItems.length ? (
                    <View style={{ gap: 10 }}>
                      {section.coveredItems.map((item) => (
                        <Card
                          key={item}
                          bg={colors.box}
                          border={colors.border}
                          style={{ gap: 6, padding: 12 }}
                        >
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            Covered
                          </Text>
                          <Text style={{ color: colors.fg, lineHeight: 22 }}>
                            {item}
                          </Text>
                        </Card>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.muted, lineHeight: 22 }}>
                      No covered job-description themes were identified.
                    </Text>
                  )}
                </View>

                <View style={{ gap: 10 }}>
                  <Text
                    style={{
                      color: colors.fg,
                      fontSize: 14,
                      fontWeight: "800",
                    }}
                  >
                    Key spots to cover next time
                  </Text>
                  {section.missingItems.length ? (
                    <View style={{ gap: 10 }}>
                      {section.missingItems.map((item) => (
                        <Card
                          key={item}
                          bg={colors.box}
                          border={colors.border}
                          style={{ gap: 6, padding: 12 }}
                        >
                          <Text
                            style={{
                              color: "#D28C3C",
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            Next Time
                          </Text>
                          <Text style={{ color: colors.fg, lineHeight: 22 }}>
                            {item}
                          </Text>
                        </Card>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.muted, lineHeight: 22 }}>
                      No missing job-description themes were identified.
                    </Text>
                  )}
                </View>
              </Card>
            );
          }

          if (section.kind === "reflection") {
            return (
              <Card key={section.key} style={{ gap: 10 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                {section.traits.length ? (
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 13,
                      fontWeight: "800",
                      lineHeight: 20,
                    }}
                  >
                    Perceived traits: {section.traits.join(", ")}
                  </Text>
                ) : null}
                <Text style={{ color: colors.fg, lineHeight: 24, fontSize: 16 }}>
                  {section.text}
                </Text>
              </Card>
            );
          }

          if (section.kind === "rewrite") {
            return (
              <Card key={section.key} style={{ gap: 12 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                {section.items.length ? (
                  <View style={{ gap: 10 }}>
                    {section.items.map((item, index) => (
                      <Card
                        key={`${item.original}-${index}`}
                        bg={colors.box}
                        border={colors.border}
                        style={{ gap: 10, padding: 12 }}
                      >
                        <View style={{ gap: 4 }}>
                          <Text
                            style={{
                              color: "#D28C3C",
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            Original phrasing
                          </Text>
                          <Text style={{ color: colors.fg, lineHeight: 22 }}>
                            {item.original}
                          </Text>
                        </View>
                        <View style={{ gap: 4 }}>
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            Better way to say it
                          </Text>
                          <Text style={{ color: colors.fg, lineHeight: 22 }}>
                            {item.revised}
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.muted, lineHeight: 22 }}>
                    No phrase rewrites were identified.
                  </Text>
                )}
              </Card>
            );
          }

          const transcriptPreviewCount = section.previewTurns ?? 3;
          const previewTurns = analysis.turns.slice(0, transcriptPreviewCount);
          const transcriptExpanded = expandedTranscriptKey === section.key;

          return (
            <Card key={section.key} style={{ gap: 12 }}>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  {section.title}
                </Text>
                <Text style={{ color: colors.muted, lineHeight: 20 }}>
                  {transcriptExpanded
                    ? "Full session transcript."
                    : "Expand to review the full conversation."}
                </Text>
              </View>

              {transcriptExpanded ? (
                <View style={{ gap: 10 }}>
                  {analysis.turns.length ? (
                    analysis.turns.map((turn) => {
                      const isUser = turn.role === "user";
                      return (
                        <Card
                          key={turn.id}
                          bg={isUser ? colors.box : colors.card}
                          border={colors.border}
                          style={{
                            gap: 8,
                            padding: 12,
                            alignSelf: isUser ? "flex-end" : "flex-start",
                            maxWidth: "92%",
                          }}
                        >
                          <Text
                            style={{
                              color: colors.muted,
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            {speakerLabel(turn.role)}
                          </Text>
                          <Text style={{ color: colors.fg, lineHeight: 22 }}>
                            {turn.text}
                          </Text>
                        </Card>
                      );
                    })
                  ) : (
                    <Text style={{ color: colors.muted, lineHeight: 22 }}>
                      No transcript available.
                    </Text>
                  )}
                  <Pressable onPress={() => setExpandedTranscriptKey(null)}>
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>
                      Hide transcript
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setExpandedTranscriptKey(section.key)}>
                  <Card
                    bg={colors.box}
                    border={colors.border}
                    style={{ gap: 10 }}
                  >
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      Preview
                    </Text>
                    {previewTurns.length ? (
                      <View style={{ gap: 10 }}>
                        {previewTurns.map((turn) => (
                          <View key={turn.id} style={{ gap: 4 }}>
                            <Text
                              style={{
                                color: colors.fg,
                                fontSize: 12,
                                fontWeight: "800",
                              }}
                            >
                              {speakerLabel(turn.role)}
                            </Text>
                            <Text
                              style={{ color: colors.muted, lineHeight: 21 }}
                            >
                              {excerpt(turn.text, 16)}
                            </Text>
                          </View>
                        ))}
                        {analysis.turns.length > previewTurns.length ? (
                          <Text
                            style={{
                              color: colors.accent,
                              fontSize: 12,
                              fontWeight: "700",
                            }}
                          >
                            View full transcript
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={{ color: colors.muted, lineHeight: 22 }}>
                        No transcript available.
                      </Text>
                    )}
                  </Card>
                </Pressable>
              )}
            </Card>
          );
        })}
      </View>

      {materials.length ? (
        <Card style={{ gap: 12 }}>
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Materials
            </Text>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              {materialsExpanded
                ? "Reference material used in the session."
                : `${materials.length} material${
                    materials.length === 1 ? "" : "s"
                  } attached.`}
            </Text>
          </View>

          {!materialsExpanded ? (
            <Pressable onPress={() => setMaterialsExpanded(true)}>
              <Card bg={colors.box} border={colors.border} style={{ gap: 8 }}>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  Preview
                </Text>
                <Text style={{ color: colors.fg, fontWeight: "800" }}>
                  {materials[0].name}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {materials[0].kind} | {materials[0].mimeType}
                </Text>
                <Text style={{ color: colors.muted, lineHeight: 20 }}>
                  {materials[0].promptText.slice(0, 120)}
                  {materials[0].promptText.length > 120 ? "..." : ""}
                </Text>
                {materials.length > 1 ? (
                  <Text
                    style={{
                      color: colors.accent,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    View all materials
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          ) : (
            <View style={{ gap: 10 }}>
              {materials.map((attachment) => (
                <Card
                  key={attachment.id}
                  bg={colors.box}
                  border={colors.border}
                  style={{ gap: 8 }}
                >
                  <Text style={{ color: colors.fg, fontWeight: "800" }}>
                    {attachment.name}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {attachment.kind} | {attachment.mimeType}
                  </Text>
                  <Text style={{ color: colors.muted, lineHeight: 20 }}>
                    {attachment.promptText.slice(0, 180)}
                    {attachment.promptText.length > 180 ? "..." : ""}
                  </Text>
                </Card>
              ))}
              <Pressable onPress={() => setMaterialsExpanded(false)}>
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  Hide materials
                </Text>
              </Pressable>
            </View>
          )}
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <AppButton
          title="Save Session"
          color={colors.accent}
          fg={colors.onAccent}
          style={{ paddingVertical: 14 }}
          onPress={async () => {
            try {
              const saved = await saveCurrentSummary();
              clearCurrentFlow();
              router.replace(`/history/${saved.id}` as any);
            } catch (error: any) {
              Alert.alert(
                "Save failed",
                error?.message ?? "Unable to save this session."
              );
            }
          }}
        />
        <Pressable
          onPress={() => {
            Alert.alert(
              "Discard session?",
              "This will clear the current summary and return you home.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: () => {
                    clearCurrentFlow();
                    router.replace("/");
                  },
                },
              ]
            );
          }}
        >
          <Text
            style={{
              color: colors.muted,
              textAlign: "center",
              fontWeight: "700",
            }}
          >
            Discard and return home
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
