// app/recording/[id].tsx
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";

import PageHeader from "@/components/PageHeader";
import { useRecordings, useTheme } from "@/context";
import { ORDERED_METRIC_LABELS } from "@/lib/audio/grade";
import AudioPlayer from "../../components/AudioPlayer";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionTitle from "../../components/SectionTitle";

export default function RecordingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { history, deleteRecording, updateRecordingNotes } = useRecordings();

  const rec = useMemo(() => {
    const key = String(id);
    return (history || []).find(
      (h: any) => String(h.id) === key || String(h.createdAt) === key
    );
  }, [id, history]);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(rec?.notes ?? "");

  // Collapsible states (default closed)
  const [showSummary, setShowSummary] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);

  if (!rec) {
    return (
      <Screen
        scroll={false}
        backgroundColor={colors.bg}
        style={{ padding: 16 }}
      >
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
            Recording not found
          </Text>
          <Text style={{ color: colors.muted }}>
            This item may have been removed or hasn’t been saved yet.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#333",
            }}
          >
            <Text style={{ color: colors.fg }}>Go Back</Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  const r = rec as any;

  // Prefer server overall score; fallback to legacy
  const overall: number | null =
    typeof r.ai?.overallScore === "number"
      ? r.ai.overallScore
      : typeof r.score === "number"
      ? r.score
      : null;

  // Server AI fields
  const dialogue: Array<{ speaker?: string; text?: string }> = Array.isArray(
    r?.ai?.dialogue
  )
    ? r.ai.dialogue
    : [];

  const strengths: string[] = Array.isArray(r?.ai?.strengths)
    ? r.ai.strengths
    : [];
  const areas: string[] = Array.isArray(r?.ai?.areasForImprovement)
    ? r.ai.areasForImprovement
    : Array.isArray(r?.ai?.areas_for_improvement)
    ? r.ai.areas_for_improvement
    : [];
  const recs: string[] = Array.isArray(r?.ai?.recommendations)
    ? r.ai.recommendations
    : [];
  const summary: string =
    typeof r?.ai?.summary === "string" && r.ai.summary.trim().length
      ? r.ai.summary.trim()
      : "";
  const orderedLabels = ORDERED_METRIC_LABELS as readonly string[];
  const metrics =
    r?.ai?.metrics && typeof r.ai.metrics === "object" ? r.ai.metrics : {};
  const attributeEntries = [
    ...ORDERED_METRIC_LABELS.map((label) => {
      const raw = (metrics as Record<string, number>)?.[label];
      return Number.isFinite(Number(raw))
        ? { label, value: Number(raw) }
        : null;
    }).filter(Boolean),
    ...Object.entries(metrics)
      .filter(([label]) => !orderedLabels.includes(label))
      .map(([label, value]) =>
        Number.isFinite(Number(value)) ? { label, value: Number(value) } : null
      )
      .filter(Boolean),
  ] as { label: string; value: number }[];

  // Optional meta: file size
  const fileSizeBytes: number | null =
    typeof r?.ai?.file_size_bytes === "number"
      ? r.ai.file_size_bytes
      : typeof r?.fileSizeBytes === "number"
      ? r.fileSizeBytes
      : null;

  function formatBytes(b?: number | null) {
    if (!b || b <= 0) return null;
    const kb = b / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  async function shareDetails() {
    const lines = dialogue
      .map((d) => `${(d.speaker || "speaker").toUpperCase()}: ${d.text || ""}`)
      .join("\n");

    const text = `SHADOW Report

Date: ${new Date(r.createdAt).toLocaleString()}
${overall != null ? `Overall: ${overall}/100\n\n` : ""}${
      summary ? `Summary:\n${summary}\n\n` : ""
    }Dialogue:
${lines || "(none)"}

Notes:
${(r.notes || "").trim() || "(none)"}
`;
    await Share.share({ message: text });
  }

  function confirmDelete() {
    Alert.alert(
      "Delete recording?",
      "This will permanently remove the audio file (if present), dialogue, and notes.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const key = String(id);
            deleteRecording(key);
            router.replace("/recording");
          },
        },
      ]
    );
  }

  function startEditingNotes() {
    setNotesDraft(r.notes ?? "");
    setIsEditingNotes(true);
  }
  function cancelEditingNotes() {
    setNotesDraft(r.notes ?? "");
    setIsEditingNotes(false);
  }
  function saveNotes() {
    const key = String(id);
    updateRecordingNotes(key, notesDraft);
    setIsEditingNotes(false);
  }

  return (
    <Screen scroll={false} backgroundColor={colors.bg} style={{ padding: 16 }}>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
        {/* Top bar */}
        <View style={{ backgroundColor: colors.bg }}>
          <PageHeader
            title="Details"
            left={
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  padding: 6,
                  borderRadius: 9999,
                  backgroundColor: colors.box,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Ionicons name="chevron-back" size={20} color={colors.fg} />
              </Pressable>
            }
          />
        </View>

        {/* Meta + Player (polished) */}
        <Card style={{ gap: 12, paddingVertical: 16 }}>
          {/* Score badge */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                height: 96,
                width: 96,
                borderRadius: 9999,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.onAccent,
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                {overall ?? "—"}
              </Text>
              <Text
                style={{
                  color: colors.onAccent,
                  fontSize: 10,
                  opacity: 0.9,
                  marginTop: -2,
                }}
              >
                OVERALL
              </Text>
            </View>
          </View>

          {/* Compact meta row */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <MetaPill
              icon="calendar-outline"
              text={new Date(r.createdAt).toLocaleString()}
            />
            {fileSizeBytes ? (
              <MetaPill
                icon="document-text-outline"
                text={formatBytes(fileSizeBytes) ?? ""}
              />
            ) : null}
          </View>

          {/* Player */}
          {!!r.audioUri && (
            <View style={{ marginTop: 4 }}>
              <AudioPlayer
                uri={r.audioUri}
                bg={colors.accent}
                fg={colors.onAccent}
              />
            </View>
          )}
        </Card>

        {/* Summary (collapsible) */}
        <Card style={{ gap: 8, paddingVertical: 12 }}>
          <Pressable
            onPress={() => setShowSummary((s) => !s)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
              paddingBottom: 2,
            }}
          >
            <SectionTitle color={colors.fg}>Summary</SectionTitle>
            <Ionicons
              name={showSummary ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>

          {showSummary ? (
            summary ? (
              <Text style={{ color: colors.muted, lineHeight: 20 }}>
                {summary}
              </Text>
            ) : (
              <Text style={{ color: colors.muted }}>
                No AI summary available.
              </Text>
            )
          ) : null}
        </Card>

        {/* Highlights (collapsible as chips) */}
        <Card style={{ gap: 8, paddingVertical: 12 }}>
          <Pressable
            onPress={() => setShowHighlights((s) => !s)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
              paddingBottom: 2,
            }}
          >
            <SectionTitle color={colors.fg}>Highlights</SectionTitle>
            <Ionicons
              name={showHighlights ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>

          {showHighlights ? (
            strengths.length || areas.length || recs.length ? (
              <View style={{ gap: 30 }}>
                {strengths.length ? (
                  <ChipBlock title="Strengths" items={strengths} />
                ) : null}
                {areas.length ? (
                  <ChipBlock title="Areas for Improvement" items={areas} />
                ) : null}
                {recs.length ? (
                  <ChipBlock title="Recommendations" items={recs} />
                ) : null}
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>
                No AI highlights available.
              </Text>
            )
          ) : null}
        </Card>

        {/* Attribute breakdown */}
        <Card style={{ gap: 8, paddingVertical: 12 }}>
          <Pressable
            onPress={() => setShowAttributes((s) => !s)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
              paddingBottom: 2,
            }}
          >
            <SectionTitle color={colors.fg}>Attribute Breakdown</SectionTitle>
            <Ionicons
              name={showAttributes ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>

          {showAttributes ? (
            attributeEntries.length ? (
              <View style={{ gap: 12 }}>
                {attributeEntries.map((attr) => (
                  <AttributeRow
                    key={attr.label}
                    label={attr.label}
                    value={attr.value}
                  />
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>
                No attribute breakdown available.
              </Text>
            )
          ) : null}
        </Card>

        {/* Dialogue (collapsible) */}
        <Card style={{ gap: 8, paddingVertical: 12 }}>
          <Pressable
            onPress={() => setShowDialogue((s) => !s)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
              paddingBottom: 2,
            }}
          >
            <SectionTitle color={colors.fg}>Dialogue</SectionTitle>
            <Ionicons
              name={showDialogue ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.muted}
            />
          </Pressable>

          {showDialogue ? (
            dialogue.length ? (
              <View style={{ gap: 8 }}>
                {dialogue.map((d, idx) => (
                  <DialogueRow key={idx} speaker={d.speaker} text={d.text} />
                ))}
              </View>
            ) : (
              <Text style={{ color: colors.muted }}>
                No dialogue available.
              </Text>
            )
          ) : null}
        </Card>

        {/* Notes (with edit pencil) */}
        <Card style={{ gap: 8, paddingVertical: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionTitle color={colors.fg}>Notes</SectionTitle>

            {!isEditingNotes ? (
              <Pressable
                onPress={startEditingNotes}
                hitSlop={8}
                style={{
                  padding: 6,
                  borderRadius: 9999,
                  backgroundColor: colors.box,
                  borderColor: colors.border,
                  borderWidth: 1,
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.fg} />
              </Pressable>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={saveNotes}
                  hitSlop={8}
                  style={{
                    padding: 6,
                    borderRadius: 9999,
                    backgroundColor: colors.accent,
                  }}
                >
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.onAccent}
                  />
                </Pressable>
                <Pressable
                  onPress={cancelEditingNotes}
                  hitSlop={8}
                  style={{
                    padding: 6,
                    borderRadius: 9999,
                    backgroundColor: "#333",
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.fg} />
                </Pressable>
              </View>
            )}
          </View>

          {!isEditingNotes ? (
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              {r.notes?.trim() || "(No notes saved)"}
            </Text>
          ) : (
            <TextInput
              multiline
              autoFocus
              value={notesDraft}
              onChangeText={setNotesDraft}
              placeholder="Add or update your notes…"
              placeholderTextColor={colors.muted}
              style={{
                color: colors.fg,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                minHeight: 120,
                textAlignVertical: "top",
              }}
            />
          )}
        </Card>

        {/* Actions (bottom in flow) */}
        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={shareDetails}
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: colors.onAccent, fontWeight: "800" }}>
              Share
            </Text>
          </Pressable>

          <Pressable
            onPress={confirmDelete}
            style={{
              backgroundColor: "#B00020",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ---------- UI helpers ---------- */

function MetaPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.fg} />
      <Text style={{ color: colors.fg, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function ChipBlock({ title, items }: { title: string; items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 18 }}>
      <Text
        style={{
          color: colors.fg,
          fontWeight: "800",
          fontSize: 18,
          textAlign: "center",
          textDecorationLine: "underline",
          textDecorationColor: colors.border,
          textDecorationStyle: "solid",
          letterSpacing: 0.06,
        }}
      >
        {title}
      </Text>
      <View style={{ gap: 12 }}>
        {items.map((t, i) => (
          <View
            key={`${title}-${i}`}
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: colors.muted, lineHeight: 20 }}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AttributeRow({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  const capped = Math.max(0, Math.min(value > 10 ? 100 : 10, value));
  const denom = value > 10 ? 100 : 10;
  const percent = Math.min(1, Math.max(0, capped / denom));
  const display = Number.isInteger(value) ? value : Number(value.toFixed(1));

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: colors.muted, fontWeight: "700" }}>{label}</Text>
        <Text style={{ color: colors.muted, fontWeight: "800" }}>
          {display}
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 9999,
          backgroundColor: "#1f1f1f",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percent * 100}%`,
            height: "100%",
            backgroundColor: colors.accent,
          }}
        />
      </View>
    </View>
  );
}

function DialogueRow({ speaker, text }: { speaker?: string; text?: string }) {
  const { colors } = useTheme();
  const who = (speaker || "speaker").toLowerCase();
  const sales = who === "salesman" || who === "seller" || who === "rep";
  const bg = sales ? "#1f3d2a" : "#2b2b3a";
  const fg = sales ? "#9BE870" : "#9aa3ff";

  return (
    <View
      style={{
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      {/* Speaker pill */}
      <View
        style={{
          alignSelf: "flex-start",
          backgroundColor: bg,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 9999,
        }}
      >
        <Text style={{ color: fg, fontWeight: "800", fontSize: 12 }}>
          {(speaker || "speaker").toUpperCase()}
        </Text>
      </View>

      {/* Line text */}
      <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
        {text || ""}
      </Text>
    </View>
  );
}
