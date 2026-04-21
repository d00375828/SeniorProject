import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import AppButton from "@/components/AppButton";
import BackButton from "@/components/BackButton";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Screen from "@/components/Screen";
import {
  AttachmentKind,
  SessionAttachment,
  useSession,
  useTheme,
} from "@/context";
import { uploadRoleplayContext } from "@/lib/roleplay/client";

const ATTACHMENT_KIND_OPTIONS: { kind: AttachmentKind; label: string }[] = [
  { kind: "slides", label: "Slides" },
  { kind: "instructions", label: "Instructions" },
  { kind: "rubric", label: "Rubric" },
  { kind: "notes", label: "Notes" },
];
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_ATTACHMENT_EXTENSIONS = [".pdf", ".txt", ".md"];

const scenarioAccent = {
  "team-presentation": "#25b8a6",
  "job-interview": "#67a6ff",
  "difficult-conversation": "#ff7d6b",
  "q-and-a-pressure": "#f2c14e",
} as const;

const scenarioGlow = {
  "team-presentation": "rgba(37, 184, 166, 0.18)",
  "job-interview": "rgba(103, 166, 255, 0.18)",
  "difficult-conversation": "rgba(255, 125, 107, 0.18)",
  "q-and-a-pressure": "rgba(242, 193, 78, 0.18)",
} as const;

const fieldChips = {
  userRole: ["Presenter", "Candidate", "Speaker", "Leader"],
  objective: [
    "Open clearly and keep steady pacing",
    "Answer with structure and specific examples",
    "Stay calm, empathic, and direct",
    "Recover quickly from pressure",
  ],
  partnerStyle: [
    "Supportive but attentive audience",
    "Professional interviewer with follow-ups",
    "Emotionally charged but open to dialogue",
    "Curious but challenging questioner",
  ],
} as const;

function hasSupportedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return SUPPORTED_ATTACHMENT_EXTENSIONS.some((extension) =>
    lower.endsWith(extension)
  );
}

export default function SetupScreen() {
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { colors } = useTheme();
  const { scenarios, startSession } = useSession();

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId),
    [scenarioId, scenarios]
  );

  const [userRole, setUserRole] = useState(
    scenario?.defaultConfig.userRole ?? ""
  );
  const [objective, setObjective] = useState(
    scenario?.defaultConfig.objective ?? ""
  );
  const [partnerStyle, setPartnerStyle] = useState(
    scenario?.defaultConfig.partnerStyle ?? ""
  );
  const [selectedAttachmentKind, setSelectedAttachmentKind] =
    useState<AttachmentKind>("slides");
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const featuredAccent = scenario
    ? scenarioAccent[scenario.id as keyof typeof scenarioAccent] ??
      colors.accent
    : colors.accent;
  const featuredGlow =
    scenario && scenarioGlow[scenario.id as keyof typeof scenarioGlow]
      ? scenarioGlow[scenario.id as keyof typeof scenarioGlow]
      : "rgba(37, 184, 166, 0.18)";

  const preview = useMemo(() => {
    const resolvedUserRole =
      userRole.trim() || scenario?.defaultConfig.userRole || "";
    const resolvedObjective =
      objective.trim() || scenario?.defaultConfig.objective || "";
    const resolvedPartnerStyle =
      partnerStyle.trim() || scenario?.defaultConfig.partnerStyle || "";
    const filledFields = [
      userRole.trim(),
      objective.trim(),
      partnerStyle.trim(),
    ].filter(Boolean).length;

    return {
      resolvedUserRole,
      resolvedObjective,
      resolvedPartnerStyle,
      filledFields,
      readinessLabel:
        filledFields === 3
          ? "Ready to start"
          : filledFields === 2
          ? "Almost ready"
          : "Quick setup",
    };
  }, [
    objective,
    partnerStyle,
    scenario?.defaultConfig.objective,
    scenario?.defaultConfig.partnerStyle,
    scenario?.defaultConfig.userRole,
    userRole,
  ]);

  if (!scenario) {
    router.replace("/");
    return null;
  }

  async function onPickDocument() {
    if (uploadBusy) return;
    if (attachments.length >= MAX_ATTACHMENTS) {
      Alert.alert(
        "Limit reached",
        "Upload up to 3 supporting files for this session."
      );
      return;
    }

    try {
      setUploadError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/markdown"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name || "context-upload";
      const mimeType = asset.mimeType || "application/octet-stream";

      if (!hasSupportedExtension(fileName)) {
        throw new Error(
          "Unsupported file type. Upload a PDF, TXT, or Markdown file."
        );
      }

      if (
        typeof asset.size === "number" &&
        asset.size > MAX_ATTACHMENT_FILE_SIZE_BYTES
      ) {
        throw new Error(
          "That file is too large. Upload a file smaller than 10 MB."
        );
      }

      setUploadBusy(true);
      const attachment = await uploadRoleplayContext(
        asset.uri,
        fileName,
        mimeType,
        selectedAttachmentKind
      );

      setAttachments((current) => [...current, attachment]);
    } catch (error: any) {
      const message =
        error?.message ?? "Unable to upload and process that document.";
      setUploadError(message);
      Alert.alert("Upload failed", message);
    } finally {
      setUploadBusy(false);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((item) => item.id !== id));
  }

  return (
    <Screen backgroundColor={colors.bg} style={{ padding: 16, gap: 16 }}>
      <PageHeader title="Setup" left={<BackButton />} />

      <Card
        bg={colors.card}
        border={colors.border}
        style={{
          gap: 14,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -48,
            right: -28,
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: featuredGlow,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: -28,
            bottom: -34,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        />

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
            Scenario setup
          </Text>
          <Text style={{ color: colors.fg, fontSize: 26, fontWeight: "900" }}>
            {scenario.title}
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            {scenario.description}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
          Session configuration
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          Start with the defaults, or tap a suggestion to move faster.
        </Text>

        <View style={{ gap: 8 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}
          >
            Quick presets
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[
              {
                label: "Use defaults",
                action: () => {
                  setUserRole(scenario.defaultConfig.userRole);
                  setObjective(scenario.defaultConfig.objective);
                  setPartnerStyle(scenario.defaultConfig.partnerStyle);
                },
              },
              {
                label: "More concise",
                action: () => {
                  setObjective(
                    "Answer with structure, brevity, and a clear point"
                  );
                  setPartnerStyle("Direct but fair evaluator");
                },
              },
              {
                label: "More pressure",
                action: () => {
                  setObjective(
                    "Stay calm and recover quickly from challenging questions"
                  );
                  setPartnerStyle("Curious but challenging questioner");
                },
              },
            ].map((chip) => (
              <Pressable
                key={chip.label}
                onPress={chip.action}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: colors.box,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{ color: colors.fg, fontSize: 12, fontWeight: "700" }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}
          >
            Your role
          </Text>
          <TextInput
            value={userRole}
            onChangeText={setUserRole}
            placeholder="Presenter"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {fieldChips.userRole.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setUserRole(chip)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor:
                    chip === userRole ? featuredGlow : colors.box,
                  borderWidth: 1,
                  borderColor:
                    chip === userRole ? featuredAccent : colors.border,
                }}
              >
                <Text
                  style={{
                    color: chip === userRole ? featuredAccent : colors.fg,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}
          >
            Objective
          </Text>
          <TextInput
            value={objective}
            onChangeText={setObjective}
            placeholder="Uncover pains and secure a next step"
            placeholderTextColor={colors.muted}
            multiline
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              minHeight: 84,
              backgroundColor: colors.box,
              textAlignVertical: "top",
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {fieldChips.objective.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setObjective(chip)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor:
                    chip === objective ? featuredGlow : colors.box,
                  borderWidth: 1,
                  borderColor:
                    chip === objective ? featuredAccent : colors.border,
                }}
              >
                <Text
                  style={{
                    color: chip === objective ? featuredAccent : colors.fg,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text
            style={{ color: colors.muted, fontSize: 12, fontWeight: "700" }}
          >
            Audience or partner style
          </Text>
          <TextInput
            value={partnerStyle}
            onChangeText={setPartnerStyle}
            placeholder="Supportive but attentive audience"
            placeholderTextColor={colors.muted}
            style={{
              color: colors.fg,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: colors.box,
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {fieldChips.partnerStyle.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setPartnerStyle(chip)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor:
                    chip === partnerStyle ? featuredGlow : colors.box,
                  borderWidth: 1,
                  borderColor:
                    chip === partnerStyle ? featuredAccent : colors.border,
                }}
              >
                <Text
                  style={{
                    color: chip === partnerStyle ? featuredAccent : colors.fg,
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
          Preview
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          This is your session with the current setup.
        </Text>

        <Card bg={colors.box} border={colors.border} style={{ gap: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{ color: colors.fg, fontSize: 18, fontWeight: "900" }}
              >
                {preview.resolvedUserRole}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4, flex: 1 }}>
              <Text
                style={{
                  color: featuredAccent,
                  fontSize: 18,
                  fontWeight: "900",
                }}
              >
                {preview.readinessLabel}
              </Text>
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{ color: colors.muted, fontSize: 15, fontWeight: "700" }}
            >
              Objective
            </Text>
            <Text style={{ color: colors.fg, lineHeight: 21 }}>
              {preview.resolvedObjective}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text
              style={{ color: colors.muted, fontSize: 15, fontWeight: "700" }}
            >
              Partner style
            </Text>
            <Text style={{ color: colors.fg, lineHeight: 21 }}>
              {preview.resolvedPartnerStyle}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: colors.border,
              }}
            >
              <Text
                style={{ color: colors.fg, fontSize: 12, fontWeight: "700" }}
              >
                {preview.filledFields}/3 fields set
              </Text>
            </View>
          </View>
        </Card>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.fg, fontSize: 18, fontWeight: "800" }}>
          Upload materials - Optional
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          Upload a script, rubric, or notes. The AI will extract the text and
          use it to guide your roleplay.
        </Text>

        <Card bg={colors.box} border={colors.border} style={{ gap: 8 }}>
          <Text
            style={{ color: featuredAccent, fontSize: 12, fontWeight: "800" }}
          >
            Supported files
          </Text>
          <Text style={{ color: colors.fg, lineHeight: 21 }}>
            PDF, TXT, and Markdown. Maximum of 3 files per session, up to 10 MB
            each.
          </Text>
          <Text style={{ color: colors.muted, lineHeight: 20 }}>
            Best results: upload the actual rubric or prompt notes you want the
            AI to follow.
          </Text>
        </Card>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ATTACHMENT_KIND_OPTIONS.map((option) => {
            const selected = selectedAttachmentKind === option.kind;
            return (
              <Pressable
                key={option.kind}
                onPress={() => setSelectedAttachmentKind(option.kind)}
                style={{
                  borderWidth: 1,
                  borderColor: selected ? featuredAccent : colors.border,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: selected ? featuredGlow : colors.box,
                }}
              >
                <Text
                  style={{
                    color: selected ? featuredAccent : colors.fg,
                    fontWeight: "700",
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppButton
          title={
            uploadBusy ? "Uploading..." : `Upload ${selectedAttachmentKind}`
          }
          color={featuredAccent}
          fg={colors.onAccent}
          disabled={uploadBusy || attachments.length >= MAX_ATTACHMENTS}
          onPress={onPickDocument}
        />

        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Up to 3 files per session.
        </Text>

        {uploadError ? (
          <Text style={{ color: "#ffb3b3" }}>{uploadError}</Text>
        ) : null}

        {attachments.length ? (
          <View style={{ gap: 10 }}>
            {attachments.map((attachment) => (
              <Card
                key={attachment.id}
                bg={colors.box}
                border={colors.border}
                style={{ gap: 8 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: colors.fg, fontWeight: "800" }}>
                      {attachment.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {attachment.kind} | {attachment.mimeType}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeAttachment(attachment.id)}>
                    <Text style={{ color: colors.accent, fontWeight: "700" }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
                <Text style={{ color: colors.muted, lineHeight: 20 }}>
                  {attachment.promptText.slice(0, 180)}
                  {attachment.promptText.length > 180 ? "..." : ""}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.muted, lineHeight: 21 }}>
            No supporting materials added yet.
          </Text>
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.muted, lineHeight: 21 }}>
          After each turn, you’ll see your transcript, get an AI reply, and hear
          the response.
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: featuredGlow,
            }}
          >
            <Text
              style={{ color: featuredAccent, fontSize: 12, fontWeight: "800" }}
            >
              {preview.readinessLabel}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: colors.box,
            }}
          >
            <Text style={{ color: colors.fg, fontSize: 12, fontWeight: "700" }}>
              {attachments.length} attached
            </Text>
          </View>
        </View>
        <AppButton
          title="Start Roleplay"
          color={featuredAccent}
          fg={colors.onAccent}
          onPress={() => {
            startSession({
              scenarioId: scenario.id,
              userRole: userRole.trim() || scenario.defaultConfig.userRole,
              objective: objective.trim() || scenario.defaultConfig.objective,
              partnerStyle:
                partnerStyle.trim() || scenario.defaultConfig.partnerStyle,
              attachments,
            });
            router.push("/session" as any);
          }}
        />
        <Pressable onPress={() => router.push("/history" as any)}>
          <Text
            style={{
              color: colors.accent,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            View saved sessions
          </Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
